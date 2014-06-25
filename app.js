var data = (function() {
    var md = function(n) {
        return moment().hours(7*24).minutes(0).seconds(0).hours(-n*24).toDate();
    };
    var l = [
        {start: md(42), end: md(30), label: 'first', color: 'blue', track: 0 },
        {start: md(30), end: md(20), label: 'second', color: 'pink', track: 0 },
        {start: md(20), end: md(13), label: 'third', color: 'yellow', track: 0 },
        {start: md(13), end: md(10), label: 'fourth', color: 'green', track: 0 },
        {start: md(10), end: md(9), label: 'fifth', color: 'black', track: 0,
            collapsed: [{label: 'foo1'}, {label: 'foo2'}, {label: 'foo3'}]
         },

        {start: md(13), end: md(6), label: 'first', color: 'red', track: 1 },
        {start: md(6), end: md(3), label: 'second', color: 'red', track: 1,
            collapsed: [{label: 'bar1'}, {label: 'bar2'}]
         },
        {start: md(3), end: md(0), label: 'third', color: 'red', track: 1 },
        {start: md(0), end: md(-20), label: 'fourth', color: 'red', track: 1 }
    ];
    for (var i = 0; i < l.length; i++) {
        l[i].startM = moment(l[i].start);
        l[i].endM = moment(l[i].end);
    }
    return l;
})();

var Chart = function(trackdata, elmid) {
    var self = this;

    var calendarWidth = 1000;
    var calendarHeight = 200;
    var weekboxHeight = 60;
    var padding = 4;

    // state variables 
    var zoomBox = null; // svg group elm is dynamically created when zooming in
    var activeTrack = null; // stores the current track data    

    var domainDefault = {
        start: moment().isoWeekday(1).hours(0).minutes(0).seconds(0).milliseconds(0).hours(-24*7).toDate(),
        end: moment().isoWeekday(1).hours(0).minutes(0).seconds(0).milliseconds(0).hours(24*21).toDate()
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
    yScale.domain([0, 2]);

    var initialX = null;
    
    var dragStartHandler = function() {

    };
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
        return d.track * 50; 
    };

    var stepstartTransform = function(d) { 
        return 'translate(' + stepstart(d) + ', ' + (calendarHeight - weekboxHeight) + ')'; 
    };

    // generates week boxes on the fly ...
    var generateWeeks = function() {
        var weeks = [];
        var current = xScale.domain();

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
        var currentMidDate = moment(domain[0]).hours(14*24); // two weeks in must be about mid ...
        var shiftMs = midstepDate.diff(currentMidDate, 'milliseconds');
        var newStart = moment(domain[0]).milliseconds(shiftMs);
        var newEnd = moment(newStart).hours(4*7*24);

        xScale.domain([newStart.toDate(), newEnd.toDate()]);
        update({dataitem: baseDataItem, zoom: true, waspositive: shiftMs > 0});
        // toggleMode(baseDataItem);
    };

    var zoomBoxCloser = function() {
        // fade box out in place, then shift and show again, to be ready for next zoom
        zoomBox.select('rect.details-box')
            .transition()
            .style('opacity', 0)
            .each('end', function() {
                d3.select(this)
                    .attr('x', -calendarWidth)
                    .style('opacity', 1);
            });

        // first fade in in active tracks
        stepGroups.selectAll('rect.step')
            .filter(':not([track="' + activeTrack.nr + '"])')
            .style('display','block')
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
            .attr('height', 30)
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
        if (options.dataitem && !zoomBox) {
            zoomBox = d3.select('svg')
                .append('g')
                .attr('class', 'zoom-group');
        
            zoomBox.append('rect')
                .on('click', zoomBoxCloser)
                .attr('class', 'details-box')
                .attr('width', calendarWidth - 200)
                .attr('height', weekboxHeight + 25)
                .attr('y', 30 + padding)
                .attr('x', -calendarWidth)
                .attr('fill', 'white')
                .attr('stroke', 'silver')
                .attr('stroke-width', 1);
        }

        if (options.dataitem && !activeTrack) {
            var shiftedLeft = options.waspositive; 
            if (!shiftedLeft) {
                // causes the details box to move in the othe rway
                zoomBox
                    .select('rect.details-box')
                    .attr('x', calendarWidth*2);
            }
            zoomBox
                .select('rect.details-box')
                .transition()
                .duration(600)
                .attr('x', 100)

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

        var weekBoxes = generateWeeks();
        var weeks = svg.selectAll('g.week-boxes')
            .data(weekBoxes, function(d) { return d.start; });

        var steps = stepGroups.selectAll('rect.step')
            .transition()
            .duration(options.duration || 250)
            .attr('x', stepstart);

        steps
            .filter(activeTrack ? ':not([track="' + activeTrack.nr + '"])' : ':not(*)')
            .transition()
            .style('opacity', 0)
            .each('end', function() {
                d3.select(this)
                    .style('display', 'none');
            });

        // possibly shift active track up
        steps
            .filter(options.dataitem ? '[track="'+ options.dataitem.track +'"]' : ':not(*)')
            .attr('y', 0);

        svg.selectAll('g.week-boxes')
            .transition()
            .duration(options.duration || 250)
            .attr('transform', stepstartTransform);

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

var chart = new Chart(data, 'calendar');