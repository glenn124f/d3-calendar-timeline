var data = (function() {
    var md = function(n) {
        return moment().hours(7*24).minutes(0).seconds(0).hours(-n*24).toDate();
    };
    return [
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
})();

var Chart = function(trackdata, elmid) {
    var self = this;

    var calendarWidth = 1000;
    var calendarHeight = 200;
    var weekboxHeight = 60;

    var domainDefault = {
        start: moment().isoWeekday(1).hours(0).minutes(0).seconds(0).milliseconds(0).hours(-24*7).toDate(),
        end: moment().isoWeekday(1).hours(0).minutes(0).seconds(0).milliseconds(0).hours(24*21).toDate()
    };

    var svg = d3.select('#' + elmid)
                 .append('svg')
                 .attr('width', calendarWidth)
                 .attr('height', calendarHeight)
                 .append('g')
                 .attr('class', 'scrollbox');


    svg.append('style').text("@font-face { font-family: 'glyphicons'; src: url('fonts/glyphicons-regular.eot'); src: url('fonts/glyphicons-regular.eot?#iefix') format('embeddedopentype'), url('fonts/glyphicons-regular.woff') format('woff'), url('fonts/glyphicons-regular.ttf') format('truetype'), url('fonts/glyphicons-regular.svg#glyphicons_halflingsregular') format('svg'); }");

    var xScale = d3.time.scale().range([0, calendarWidth]);
    var yScale = d3.scale.linear().range([calendarHeight, 0]);

    // sets default domain
    xScale.domain([domainDefault.start, domainDefault.end]);
    yScale.domain([0, 2]);

    var initialX = null;
    var dragHandler = function() {
        if (initialX === null) {
            d3.select('g.scrollbox').attr('dragging', 'true');
            initialX = d3.event.sourceEvent.screenX;
        }
        var offset = initialX - d3.event.sourceEvent.screenX; 
        if (d3.event.type === 'dragend') {
            initialX = null;
            var domain = xScale.domain();
            // time/pix density 
            var offsetTime = 4*7*24*60*60*1000/calendarWidth*offset;
            var start = moment(domain[0]).milliseconds(offsetTime);
            var end = moment(domain[1]).milliseconds(offsetTime);
            d3.select('g.scrollbox').attr('dragging', null);
            d3.select('g.scrollbox').attr('transform', 'translate(0, 0)');
            xScale.domain([start.toDate(), end.toDate()]);
            update({duration: 1});
        } else {
            d3.select('g.scrollbox').attr('transform', 'translate(' + -offset + ', 0)');
        }
    };

    // this behavior is attached to the week boxes to allow dragging the timeline.
    var dragBehavior = d3.behavior.drag()
        .on('drag', dragHandler)
        .on('dragend', dragHandler);

    var stepstart = function(d) { return xScale(d.start); };
    var stepwidth = function(d) { return xScale(d.end) - xScale(d.start) - 4; };
    var stepmidweek = function (d) {
        return xScale(moment(d.start).hours(3.5*24).toDate());
    };
    var stepweek = function(d) {
        return xScale(moment(d.start).hours(7*24).toDate()) - xScale(d.start) - 4;
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
        console.log('start', start.toString());
        while (start.isBefore(end)) {
            weeks.push({
                start: moment(start).toDate()
            });
            start.hours(7*24);
        }
        return weeks;
    };

    var generateExpandBox = function(d) {
        var leftStart = xScale(d.start);
        var rightStart = xScale(d.end);

    };

    var clearExpanded = function() {
        svg.selectAll('rect.step').style('opacity', 1);
        svg.select('g.step-expand').remove();
    };

    var clickStep = function(baseDataItem, i) {
        if (baseDataItem.collapsed && baseDataItem.collapsed.length > 0) {
            // fades other track completely
            svg.selectAll('rect.step')
                .filter('[track="' + (baseDataItem.track === 0 ? 1 : 0) + '"]')
                .transition().duration(500)
                .style('opacity', 0);

            svg.selectAll('rect.step')
                .filter('[track="' + (baseDataItem.track === 0 ? 0 : 1) + '"]')
                .transition().duration(100)
                .attr('y', 0)
                .each('end', function() {

                    svg.append('g').attr('class', 'step-expand');
                    var stepExpand = svg.select('g.step-expand')
                        .selectAll('rect.expand')
                        .data(baseDataItem.collapsed)
                        .enter();

                    stepExpand.append('rect')
                        .attr('class', 'expand')
                        .attr('x', function() { return stepstart(baseDataItem); })
                        .attr('y', 0)
                        .attr('width', function() { return stepwidth(baseDataItem); })
                        .attr('height', 30)
                        .attr('fill', 'purple');

                    stepExpand.append('text')
                        .attr('x', function() { return stepstart(baseDataItem); })
                        .attr('y', 0)
                        .attr('style', 'font-family: \'glyphicons\'')
                        .text('\u0001')

                    svg.selectAll('rect.expand')
                        .transition()
                        .attr('y', 36)
                        .attr('height', 100)
                        .attr('width', 500);

                    
                });
        }
    };

    // binds tracks data once
    svg.selectAll('rect.step')
        .data(trackdata)
        .enter().append('rect')
            .attr('class', 'step')
            .attr('track', function(d) { return d.track; })
            .attr('x', stepstart)
            .attr('y', function(d, i) { return d.track * 50; })
            .attr('width', stepwidth)
            .attr('height', 30)
            .attr('fill', function(d) { return d.color; })
            .on('click', clickStep);

    // call after setting domain, to update visuals
    var update = function(options) {

        clearExpanded();

        var weekBoxes = generateWeeks();

        var weeknrText = function(d) { return 'UGE ' + moment(d.start).isoWeek(); };
        var datespanText = function(d) {
            return moment(d.start).format('DD-MM-YYYY') + ' - ' + 
                moment(d.start).hours(6*24).format('DD-MM-YYYY'); 
        };

        var weeks = svg.selectAll('g.week-boxes')
            .data(weekBoxes, function(d) { return d.start; });

        // weeks.selectAll('rect.background').attr('x', stepstart);
        // weeks.selectAll('text.weeknr-text').attr('x', stepmidweek);
        // weeks.selectAll('text.datespan').attr('x', stepmidweek);
        // weeks.selectAll('text.days').transition().duration(options.duration || 250).attr('x', stepstart);

        svg.selectAll('rect.step')
            .transition()
            .duration(options.duration || 250)
            .attr('x', stepstart);

        svg.selectAll('g.week-boxes')
            // .transition()
            // .duration(options.duration || 250)
            .attr('transform', stepstartTransform);

        var weekElm = weeks.enter()
            .append('g')
            .attr('class', 'week-boxes')
            .attr('transform', stepstartTransform)
            .call(dragBehavior);

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