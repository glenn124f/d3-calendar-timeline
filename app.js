var Chart = function(trackdata, elmid, tracknr) {
    var self = this;

    var calendarWidth = 1000;
    var calendarHeight = 180;
    var timelineHeight = 60;
    var detailsBoxHeight = 60;
    var padding = 4;
    var stepHeight = 30;
    var iconOffset = 40;
    var durationDefault = 250;
    // in order to avoid shifting the number of days in the month display, we use a fixed number of days
    var monthInDays = 122; 
    // state variables 
    var activeTrack = null; // stores the current track data    
    var domainState = 'week-default'; // week/month-default/scrolled
    var initialX = null; // used by dragHandler

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
        end: moment(monthStart).add('days', monthInDays)
    };

    var dragHandler = function() {
        if (initialX === null) {
            root.attr('dragging', 'true');
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
            root.attr('dragging', null);
            scrollbox.attr('transform', 'translate(0, 0)');
            xScale.domain([start.toDate(), end.toDate()]);
            update({duration: 1});
        } else {
            scrollbox.attr('transform', 'translate(' + -offset + ', 0)');
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

    var stepClickHandler = function(baseDataItem, i) {
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
        update({dataitem: baseDataItem, zoomEvent: !isWeeks});
    };

    var scrollHandler = function() {
        var e = d3.event;
        var scrolledUp = e.wheelDelta > 0;
        var isWeek = domainState.indexOf('week') === 0;
        var domain = xScale.domain();
        var shift = (scrolledUp ? 1: -1) * (isWeek ? 4 : 10);
        var newStart = moment(domain[0]).add('days', shift);
        var newEnd = moment(newStart);
        if (isWeek) {
            newEnd.add('weeks', 4);
        } else {
            newEnd.add('days', monthInDays);
        }

        e.preventDefault();
        xScale.domain([newStart.toDate(), newEnd.toDate()]);
        domainState = (isWeek ? 'week' : 'month') + '-scrolled';
        update({duration: 150});
        return false;
    };

    var generateWeekBoxes = function() {
        var weekElm = this
            .append('g')
            .attr('class', 'week-box')
            .attr('transform', defaultTransform);

        weekElm.append('rect')
            .attr('class', 'background')
            .attr('width', timelineStepwidth)
            .attr('height', timelineHeight)
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
    };
    
    var generateMonthBoxes = function() {
        var monthElm = this
            .append('g')
            .attr('class', 'month-box')
            .attr('transform', defaultTransform);

        monthElm.append('rect')
            .attr('class', 'background')
            .attr('width', timelineStepwidth)
            .attr('height', timelineHeight)
            .attr('fill', '#eee');

        monthElm.append('text')
            .attr('class', 'month-text')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 27)
            .text(monthText);

        monthElm.append('text')
            .attr('class', 'year-text')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 48)
            .text(yearText);
    };

    var weeknrText = function(d) { return 'UGE ' + moment(d.start).isoWeek(); };
    var monthText = function(d) {
        return moment(d.start).format('MMMM');
    };
    var yearText = function(d) {
        return moment(d.start).format('YYYY');
    };
    var datespanText = function(d) {
        return moment(d.start).format('DD-MM-YYYY') + ' - ' + 
            moment(d.start).add('days', 6).format('DD-MM-YYYY'); 
    };

    var stepstart = function(d) { return xScale(d.start); };
    var stepwidth = function(d) { 
        return xScale(d.end) - xScale(d.start) + 0.3; // removes figde of pixel gap 
    };
    var timelineStepwidth = function(d) {
        return xScale(d.end) - xScale(d.start) - 3;
    };
    var stepmidweek = function (d) {
        return xScale(moment(d.start).add('hours', 3.5*24).toDate());
    };
    var stepweek = function(d) {
        return xScale(moment(d.start).add('days', 7).toDate()) - xScale(d.start) - padding;
    };
    var trackY = function(d, i) { 
        return (d.track * stepHeight) + (d.track * padding); 
    };
    // used for main week animations
    var defaultTransform = function(d) {
        return 'translate({0}, {1})'.f(stepstart(d), calendarHeight - timelineHeight);
    }

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

    ////////////////////////////////////////////////////////////////////////////
    // startup processing, create data elms, ui containers, etc

    var root = d3.select('#' + elmid).append('svg');
    root.on('mousewheel', scrollHandler);

    // main step data and timeline container, most stuff in here animate 
    // according to the x domain.
    var scrollbox = root
                 .attr('width', calendarWidth)
                 .attr('height', calendarHeight)
                 .append('g')
                 .attr('class', 'scrollbox');

    var xScale = d3.time.scale().range([0, calendarWidth]);
    var yScale = d3.scale.linear().range([calendarHeight, 0]);

    // sets default domain
    xScale.domain([domainDefault.start, domainDefault.end]);
    yScale.domain([0, 3]);

    // this behavior is attached to the week boxes to allow dragging the timeline.
    var dragBehavior = d3.behavior.drag()
        .on('drag', dragHandler)
        .on('dragend', dragHandler);

    // timeline groups
    var weekGroup = scrollbox.append('g').attr('class', 'week-container');
    var monthGroup = scrollbox.append('g').attr('class', 'month-container');
    var tickGroup = scrollbox.append('g').attr('class', 'tick-container');

    // binds tracks data once
    var stepGroups = scrollbox.selectAll('g.step')
        .data(trackdata)
        .enter().append('g');

    // step contents
    stepGroups.append('rect')
            .attr('class', 'step')
            .attr('track', function(d) { return d.track; })
            .attr('x', stepstart)
            .attr('y', trackY)
            .attr('width', stepwidth)
            .attr('height', stepHeight)
            .attr('fill', function(d) { return d.color; })
            .on('click', stepClickHandler);

    // we add a static rect that handles our dragging
    root.append('rect')
        .attr('class', 'dragbox')
        .attr('width', calendarWidth)
        .attr('height', timelineHeight + 30)
        .attr('y', calendarHeight - timelineHeight - 15)
        .attr('fill', 'transparent')
        .call(dragBehavior);

    // static icons
    var iconGroup = root.append('g')
        .attr('class', 'icon-container')
        .attr('transform', 'translate('+ (calendarWidth) +', 0)');
    
    var weekHtml = '&#xe237; <title>Ugevisning</title>';
    var monthHtml = '&#xe238; <title>Månedsvisning</title>';
    // toggles months/weeks
    iconGroup.append('text')
        .attr('x', -42)
        .attr('y', iconOffset)
        .attr('class', 'icon')
        .html(monthHtml)
        .on('click', function() {
            var toMonths = domainState.indexOf('week') === 0;
            xScale.domain(toMonths ? getMonthDomain(xScale, monthInDays) : getWeekDomain(xScale));
            domainState = toMonths ? 'month-default' : 'week-default';
            d3.select(this).html(toMonths ? weekHtml : monthHtml);
            update({zoomEvent: true});
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

    // details box
    var zoomGroup = root
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

    ////////////////////////////////////////////////////////////////////////////
    // call after setting domain, to update visuals
    var update = function(options) {
        if (options.dataitem && !activeTrack) {
            zoomGroup.transition()
                .duration(options.duration || durationDefault)
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


        // timeline processing

        var isWeeks = domainState.indexOf('week') === 0;
        var weekData = generateTimelineUnits(xScale);
        var monthData = generateTimelineUnits(xScale, true, false, !isWeeks);
        var weekTickData = generateTimelineUnits(xScale, false, true);

        if (isWeeks) {
            var weeks = weekGroup.selectAll('g.week-box')
                .data(weekData, function(d) { return d.start; });
            weeks.enter().call(generateWeekBoxes);
            weeks.exit().remove();

            // selection for possibly animating out
            var months = monthGroup.selectAll('g.month-box');
            var ticks = tickGroup.selectAll('g.tick-box');
        } else {
            var weeks = weekGroup.selectAll('g.week-box');
            var months = monthGroup.selectAll('g.month-box')
                .data(monthData, function(d) { return d.start; });

            var ticks = tickGroup.selectAll('g.tick-box')
                .data(weekTickData, function(d) { return d.start; });

            var tickElm = ticks.enter()
                .append('g')
                .attr('class', 'tick-box')
                .attr('transform', defaultTransform);

            tickElm.append('text')
                .attr('text-anchor', 'left')
                .attr('x', 0)
                .attr('y', -5)
                .text(function(d) {
                    return moment(d.start).isoWeek();
                });

            ticks.exit().remove();
            months.enter().call(generateMonthBoxes);
            months.exit().remove();
        }

        // decide animation when zooming in or out
        if (options.zoomEvent && isWeeks) {
            // from months to weeks
            weeks
                .style('display', 'block')
                .attr('transform', defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(options.duration || durationDefault)
                .style('opacity', 1);
            months
                .style('display', 'none');
            ticks
                .style('display', 'none');
        } else if (options.zoomEvent) {
            // from weeks to months
            months
                .style('display', 'block')
                .attr('transform', defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(options.duration || durationDefault)
                .style('opacity', 1);
            ticks
                .style('display', 'block')
                .attr('transform', defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(options.duration || durationDefault)
                .style('opacity', 1);

            weeks
                .style('display', 'none');
        } else if (isWeeks) {
            // weeks animation
            weeks
                .transition()
                .duration(options.duration || durationDefault)
                .attr('transform', defaultTransform);
        } else {
            // months animation
            months
                .transition()
                .duration(options.duration || durationDefault)
                .attr('transform', defaultTransform);
            ticks
                .transition()
                .duration(options.duration || durationDefault)
                .attr('transform', defaultTransform);
        }

                // main step animation. updates x axis + width accoding to domain
        var steps = stepGroups.selectAll('rect.step')
            .transition()
            .duration(options.duration || durationDefault)
            .attr('x', stepstart)
            .attr('width', stepwidth);

        // if we're zoomed, we might want to hide the other tracks
        steps
            .filter(activeTrack ? ':not([track="' + activeTrack.nr + '"])' : ':not(*)')
            .style('display', 'none');

        // and possibly shift active track down
        steps
            .filter(options.dataitem ? '[track="'+ options.dataitem.track +'"]' : ':not(*)')
            .attr('y', detailsBoxHeight + padding * 2);
        
    };

    // call update to render initial weeks
    update({duration: 1});
};

var chart = new Chart(generateData(), 'calendar');