var Chart = function(trackdata, elmid, tracknr) {
    var self = this;

    var calendarWidth = 1000;
    var calendarHeight = 180;
    var weekboxHeight = 60;
    var detailsBoxHeight = 60;
    var padding = 4;
    var stepHeight = 30;

    // state variables 
    var zoomGroup = null; // svg group elm is dynamically created when zooming in
    var activeTrack = null; // stores the current track data    

    var domainSizes = [4*7];
    // always start at monday of the previous week
    var domainStart = moment().isoWeekday(1).hours(0).minutes(0).seconds(0).milliseconds(0).add('days', -7);
    var domainDefault = {
        start: domainStart.toDate(),
        end: moment(domainStart).add('days', domainSizes[0]).toDate()
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
        var offsetTime = 4*7*24*60*60*1000/calendarWidth*offset;
        var domain = xScale.domain();
        // time/pix density 
        var start = moment(domain[0]).milliseconds(offsetTime);
        var end = moment(domain[1]).milliseconds(offsetTime);

        if (d3.event.type === 'dragend') {
            initialX = null;
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
            
            // construct two paths that snap to the active track, we do this manually
            var rp = {
                tlx: 0, tly: 0,
                trx: 0, 'try': 0,
                blx: 0, bly: 0,
                brx: 0, bry: 0
            };


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
    var stepwidth = function(d) { return xScale(d.end) - xScale(d.start) - padding; };
    var stepmidweek = function (d) {
        return xScale(moment(d.start).hours(3.5*24).toDate());
    };
    var stepweek = function(d) {
        return xScale(moment(d.start).hours(7*24).toDate()) - xScale(d.start) - padding;
    };
    var trackY = function(d, i) { 
        console.log('trackY', (d.track * stepHeight))
        return (d.track * stepHeight) + (d.track * padding); 
    };

    var stepstartTransform = function(d) { 
        return 'translate(' + stepstart(d) + ', ' + (calendarHeight - weekboxHeight) + ')'; 
    };

    // generates week boxes on the fly ...
    var generateWeeks = function(scale) {
        var weeks = [];
        var current = scale.domain();

        // add x weeks padding to the durrent domain, can be scrolled into view by drag
        var weekPadding = 20; 
        var start = moment(current[0]).isoWeekday(1).hours(0).minutes(0).seconds(0).hours(-24*7*weekPadding);
        var end = moment(start).hours(24*7*(weekPadding*2+4));
        while (start.isBefore(end)) {
            weeks.push({
                start: moment(start).toDate()
            });
            start.hours(7*24);
        }
        return weeks;
    };

    var clickStep = function(baseDataItem, i) {
        // gets the middle point of the clicked datespan as a moment date object 
        var midstepDate = moment(xScale.invert((xScale(baseDataItem.start) + xScale(baseDataItem.end)) / 2));
        var domain = xScale.domain();
        var currentMidDate = moment(domain[0]).add('days', 14); // two weeks in must be about mid ...
        var shiftMs = midstepDate.diff(currentMidDate, 'milliseconds');
        var newStart = moment(domain[0]).add('milliseconds', shiftMs);
        var newEnd = moment(newStart).add('days', domainSizes[0]);
        xScale.domain([newStart.toDate(), newEnd.toDate()]);
        update({dataitem: baseDataItem, zoom: true});
    };

    var zoomGroupCloser = function() {
        // fade box out in place, then shift and show again, to be ready for next zoom
        zoomGroup.selectAll('rect.details-box, text.icon')
            .transition()
            .style('opacity', 0)
            .each('end', function() {
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


    // call after setting domain, to update visuals
    var update = function(options) {
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
                .attr('transform', 'translate(0, 0)')

            var tdata = [];
            for (var i = 0; i < trackdata.length; i++) {
                if (trackdata[i].track === options.dataitem.track) {
                    tdata.push(trackdata[i]);
                }
            }
            activeTrack = { nr: options.dataitem.track, data: tdata };
        }

        // filters used to toggle visuals. 
        var activeTrackFilter = options.dataitem ? '[track="'+ options.dataitem.track +'"]' : ':not(*)';
        var inactiveTrackFilter = activeTrack ? ':not([track="' + activeTrack.nr + '"])' : ':not(*)';

        var weekBoxes = generateWeeks(xScale);
        var weeks = svg.selectAll('g.week-boxes')
            .data(weekBoxes, function(d) { return d.start; });

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
        svg.selectAll('g.week-boxes')
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