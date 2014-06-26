var Chart = function(trackdata, elmid, tracknr) {
    var self = this;

    var calendarWidth = 1000;
    var calendarHeight = 180;
    var weekboxHeight = 60;
    var detailsBoxHeight = 60;
    var padding = 4;
    var stepHeight = 30;

    var iconOffset = 40;

    // state variables 
    var zoomGroup = null; // svg group elm is dynamically created when zooming in
    var activeTrack = null; // stores the current track data    
    var domainState = 'week-default'; // week/month-default/scrolled

    var domainSizes = [4*7];
    // always start at monday of the previous week
    var domainStart = moment().isoWeekday(1).hours(0).minutes(0).seconds(0).milliseconds(0).add('days', -7);
    var domainDefault = {
        start: domainStart.toDate(),
        end: moment(domainStart).add('weeks', 4).toDate()
    };

    var monthStart = moment().date(1).hours(0).minutes(0).seconds(0).milliseconds(0).add('months', -1);
    var monthDomain = {
        start: moment(monthStart).toDate(),
        end: moment(monthStart).add('months', 4)
    };

    var root = d3.select('#' + elmid).append('svg');
    var svg = root
                 .attr('width', calendarWidth)
                 .attr('height', calendarHeight)
                 .append('g')
                 .attr('class', 'scrollbox');

    var xScale = d3.time.scale().range([0, calendarWidth]);
    var yScale = d3.scale.linear().range([calendarHeight, 0]);

    // sets default domain
    xScale.domain([domainDefault.start, domainDefault.end]);
    yScale.domain([0, 3]);

    var initialX = null;
    var dragHandler = function() {
        if (initialX === null) {
            d3.select('svg').attr('dragging', 'true');
            initialX = d3.event.sourceEvent.screenX;
        }
        var offset = initialX - d3.event.sourceEvent.screenX;
        var domain = xScale.domain();
        var domainDays = 4*7;
        if (domainState.indexOf('month') === 0) {
            // this is more complex (months differ in length, leap year trololo)
            domainDays = moment(domain[1]).diff(moment(domain[0]), 'days');
        }
        var offsetTime = domainDays*24*60*60*1000/calendarWidth*offset;
        // time/pix density 
        var start = moment(domain[0]).milliseconds(offsetTime);
        var end = moment(domain[1]).milliseconds(offsetTime);



        if (d3.event.type === 'dragend') {
            initialX = null;
            domainState = (domainState.indexOf('week') === 0 ? 'week' : 'month') + '-scrolled';
            d3.select('svg').attr('dragging', null);
            d3.select('g.scrollbox').attr('transform', 'translate(0, 0)');
            xScale.domain([start.toDate(), end.toDate()]);
            update({duration: 1});
        } else {
            d3.select('g.scrollbox').attr('transform', 'translate(' + -offset + ', 0)');
        }

        if (activeTrack) {
            var midweek = moment(start).hours(14*24);
            var activeIndex = -1;
            for(var i = 0; i < activeTrack.data.length; i++) {
                // attempt some caching
                if (!midweek.isBefore(activeTrack.data[i].startM) &&
                    midweek.isBefore(activeTrack.data[i].endM)) {
                    activeIndex = i;
                    break;
                }
            }

            if (activeIndex >= 0) {
                console.log('scope', activeIndex, activeTrack.data[activeIndex].color);
            }
        }
    };

    // this behavior is attached to the week boxes to allow dragging the timeline.
    var dragBehavior = d3.behavior.drag()
        .on('drag', dragHandler)
        .on('dragend', dragHandler);
    
    var weeknrText = function(d) { return 'UGE ' + moment(d.start).isoWeek(); };
    var datespanText = function(d) {
        return moment(d.start).format('DD-MM-YYYY') + ' - ' + 
            moment(d.start).hours(6*24).format('DD-MM-YYYY'); 
    };

    var stepstart = function(d) { return xScale(d.start); };
    var stepwidth = function(d) { 
        return xScale(d.end) - xScale(d.start) - padding; 
    };
    var stepmidweek = function (d) {
        return xScale(moment(d.start).hours(3.5*24).toDate());
    };
    var stepweek = function(d) {
        return xScale(moment(d.start).hours(7*24).toDate()) - xScale(d.start) - padding;
    };
    var trackY = function(d, i) { 
        return (d.track * stepHeight) + (d.track * padding); 
    };

    var clickStep = function(baseDataItem, i) {
        // if we're in month display, we  zoom in for week mode
        var isWeeks = domainState.indexOf('week') === 0;
        if (!isWeeks) {
            domainState = 'week-scrolled'; // assume scroll
        }
        // gets the middle point of the clicked datespan as a moment date object 
        var midstepDate = moment(xScale.invert((xScale(baseDataItem.start) + xScale(baseDataItem.end)) / 2));
        var domain = xScale.domain();
        var newStart = midstepDate.add('weeks', -2);
        var newEnd = moment(newStart).add('weeks', 4);
        xScale.domain([newStart.toDate(), newEnd.toDate()]);
        update({dataitem: baseDataItem, zoom: true});
    };

    var zoomGroupCloser = function() {
        // fade box out in place, then shift and show again, to be ready for next zoom
        zoomGroup.selectAll('rect.details-box, text.icon')
            .transition()
            .style('opacity', 0)
            .each('end', function() {
                // this gets executed multiple times, so no animations possible
                iconGroup.style('display', 'block');
                zoomGroup.attr('transform', 'translate(0, ' + -calendarHeight + ')');
                d3.select(this).style('opacity', 1);
            });

        // first fade in in active tracks
        stepGroups.selectAll('rect.step')
            .filter(':not([track="' + activeTrack.nr + '"])')
            .style('opacity',0)
            .style('display', 'block')
            .attr('x', stepstart) 
            .transition()
            .style('opacity', 1);

        // maybe shift track also
        stepGroups.selectAll('rect.step')
            .filter('[track="' + activeTrack.nr + '"]')
            .transition()
            .attr('y', trackY);
        

        activeTrack = null;
    };

    var weekGroups = svg.append('g').attr('class', 'week-container');

    // binds tracks data once
    var stepGroups = svg.selectAll('g.step')
        .data(trackdata)
        .enter().append('g');

    stepGroups.append('rect')
            .attr('class', 'step')
            .attr('track', function(d) { return d.track; })
            .attr('x', stepstart)
            .attr('y', trackY)
            .attr('width', stepwidth)
            .attr('height', stepHeight)
            .attr('fill', function(d) { return d.color; })
            .on('click', clickStep);

    // we add a static rect that handles our dragging
    d3.select('svg').append('rect')
        .attr('class', 'dragbox')
        .attr('width', calendarWidth)
        .attr('height', weekboxHeight + 30)
        .attr('y', calendarHeight - weekboxHeight - 15)
        .attr('fill', 'transparent')
        .call(dragBehavior);

    // static icons
    var iconGroup = root.append('g')
        .attr('class', 'icon-container')
        .attr('transform', 'translate('+ (calendarWidth) +', 0)');
    
    var weekHtml = '&#xe237; <title>Ugevisning</title>';
    var monthHtml = '&#xe238; <title>Maånedsvisning</title>';
    // toggles months/weeks
    iconGroup.append('text')
        .attr('x', -42)
        .attr('y', iconOffset)
        .attr('class', 'icon')
        .html(monthHtml)
        .on('click', function() {
            var toMonths = domainState.indexOf('week') === 0;
            xScale.domain(toMonths ? getMonthDomain(xScale) : getWeekDomain(xScale));
            domainState = toMonths ? 'month-default' : 'week-default';
            d3.select(this).html(toMonths ? weekHtml : monthHtml);
            update({});
        });

    // resets to default view
    // show after movement
    iconGroup.append('text')
        .attr('x', -40)
        .attr('y', iconOffset + 40)
        .attr('class', 'icon reset-view')
        .style('display', 'none')
        .html('&#xe435; <title>Gå til til dags dato</title>')
        .on('click', function() {
            var isWeeks = domainState.indexOf('week') === 0;
            var newDomain = isWeeks ? [domainDefault.start, domainDefault.end] :
                                      [monthDomain.start, monthDomain.end]; 
            xScale.domain(newDomain);
            domainState = isWeeks ? 'week-default' : 'month-default';
            update({});
        });

    // call after setting domain, to update visuals
    var update = function(options) {
        console.log('update.domainState', domainState);
        // we create the zoom layer only the first time
        if (options.dataitem && !zoomGroup) {
            zoomGroup = d3.select('svg')
                .append('g')
                .attr('class', 'zoom-group')
                .attr('transform', 'translate(0, '+ (-calendarHeight) +')');
        
            zoomGroup.append('rect')
                .on('click', zoomGroupCloser)
                .attr('class', 'details-box')
                .attr('width', calendarWidth - 200)
                .attr('height', detailsBoxHeight)
                .attr('y', 0)
                .attr('x', 100)
                .attr('fill', 'white')
                .attr('stroke', 'silver')
                .attr('stroke-width', 1);

            zoomGroup.append('text')
                .attr('class', 'zoom-pan-btn icon')
                .attr('x', 20)
                .attr('y', detailsBoxHeight/2 + 30)
                .html('&#xe211;');

            zoomGroup.append('text')
                .attr('class', 'zoom-pan-btn icon')
                .attr('x', calendarWidth-80)
                .attr('y', detailsBoxHeight/2 + 30)
                .html('&#xe212;');
        }

        if (options.dataitem && !activeTrack) {
            zoomGroup.transition()
                .ease('quad')
                .attr('transform', 'translate(0, 0)');

            iconGroup.style('display', 'none');

            var tdata = [];
            for (var i = 0; i < trackdata.length; i++) {
                if (trackdata[i].track === options.dataitem.track) {
                    tdata.push(trackdata[i]);
                }
            }
            activeTrack = { nr: options.dataitem.track, data: tdata };
        }

        // hide/show reset icon
        iconGroup.selectAll('text.reset-view')
            .style('display', domainState.indexOf('scrolled') === -1 ? 'none' : 'block');

        // filters used to toggle visuals. 
        var activeTrackFilter = options.dataitem ? '[track="'+ options.dataitem.track +'"]' : ':not(*)';
        var inactiveTrackFilter = activeTrack ? ':not([track="' + activeTrack.nr + '"])' : ':not(*)';

        var weekBoxes = generateWeeks(xScale);
        var weeks = weekGroups.selectAll('g.week-boxes')
            .data(weekBoxes, function(d) { return d.start; });

        // week box animation needs to close the options (viewtoggle)
        var stepstartTransform = function(d) { 
            var extra = domainState.indexOf('month') === 0 ? 80 : 0;
            return 'translate(' + stepstart(d) + ', ' + (calendarHeight - weekboxHeight + extra) + ')'; 
        };

        // main step animation. updates x axis accoding to domain
        var steps = stepGroups.selectAll('rect.step')
            .transition()
            .duration(options.duration || 250)
            .attr('x', stepstart);

        // if we're zoomed, we might want to hide the other tracks
        steps
            .filter(activeTrack ? ':not([track="' + activeTrack.nr + '"])' : ':not(*)')
            .style('display', 'none');

        // and possibly shift active track down
        steps
            .filter(options.dataitem ? '[track="'+ options.dataitem.track +'"]' : ':not(*)')
            .attr('y', detailsBoxHeight + padding * 2);

        // main week box scroll animation (transform on group)
        weeks
            .transition()
            .duration(options.duration || 250)
            .attr('transform', stepstartTransform);

        // create week boxes 
        var weekElm = weeks.enter()
            .append('g')
            .attr('class', 'week-boxes')
            .attr('transform', stepstartTransform);

        weekElm.append('rect')
            .attr('class', 'background')
            .attr('width', 246)
            .attr('height', weekboxHeight)
            .attr('fill', '#eee');

        weekElm.append('text')
            .attr('class', 'weeknr-text')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 27)
            .text(weeknrText);

        weekElm.append('text')
            .attr('class', 'datespan')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 48)
            .text(datespanText);

        weekElm.append('text')
            .attr('class', 'days')
            .attr('y', - 5)
            .text('M T O T F L S');


        weeks.exit().remove();
        
    };

    // call update to render initial weeks
    update({duration: 1});

};

var chart = new Chart(generateData(), 'calendar');