
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

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
        start: moment().isoWeekday(1).hours(0).minutes(0).seconds(0).hours(-24*7).toDate(),
        end: moment().isoWeekday(1).hours(0).minutes(0).seconds(0).hours(24*21).toDate()
    };

    var svg = d3.select('#' + elmid)
                 .append('svg')
                 .attr('width', calendarWidth)
                 .attr('height', calendarHeight);

    svg.append('style').text("@font-face { font-family: 'glyphicons'; src: url('fonts/glyphicons-regular.eot'); src: url('fonts/glyphicons-regular.eot?#iefix') format('embeddedopentype'), url('fonts/glyphicons-regular.woff') format('woff'), url('fonts/glyphicons-regular.ttf') format('truetype'), url('fonts/glyphicons-regular.svg#glyphicons_halflingsregular') format('svg'); }");

    var xScale = d3.time.scale().range([0, calendarWidth]);
    var yScale = d3.scale.linear().range([calendarHeight, 0]);

    // sets default domain
    xScale.domain([domainDefault.start, domainDefault.end]);
    yScale.domain([0, 2]);

    var stepstart = function(d) { return xScale(d.start); };
    var stepwidth = function(d) { return xScale(d.end) - xScale(d.start) - 4; };
    var stepmidweek = function (d) {
        return xScale(moment(d.start).hours(3.5*24).toDate());
    };
    var stepweek = function(d) {
        return xScale(moment(d.start).hours(7*24).toDate()) - xScale(d.start) - 4;
    };

    // generates week boxes on the fly ...
    var generateWeeks = function() {
        var weeks = [];
        var current = xScale.domain();
        // assumes domain is week aligned to a monday
        var start = moment(current[0]).hours(-7*24);
        var end = moment(current[1]);

        console.log('generateWeeks', start.toString(), start.toDate().getWeek(), end.toDate().getWeek());
        while (start.isBefore(end)) {
            weeks.push({
                start: moment(start).toDate(),
                weeknr: '' + moment(start).toDate().getWeek() + moment(start).toDate().getFullYear()
            });
            start.hours(7*24);
        }
        return weeks;
    };

    var generateExpandBox = function(d) {
        var leftStart = xScale(d.start);
        var rightStart = xScale(d.end);

    };

    var clickStep = function(baseDataItem, i) {
        if (baseDataItem.collapsed && baseDataItem.collapsed.length > 0) {
            var trackNr = baseDataItem.track === 0 ? 1 : 0; 
            // fades other track
            svg.selectAll('rect.step')
                .filter('[track="' + trackNr + '"]')
                .transition()
                .style('opacity', 0.1);

            // new rect which will contain new 
            var stepExpand = svg.select('g.step-expand')
                .selectAll('rect.expand')
                .data(baseDataItem.collapsed)
                .enter();

            stepExpand.append('rect')
                .attr('class', 'expand')
                .attr('x', function() { return stepstart(baseDataItem); })
                .attr('y', function() { return baseDataItem.track * 50 + 15; })
                .attr('width', function() { return stepwidth(baseDataItem); })
                .attr('height', 30)
                .attr('fill', 'purple');

            stepExpand.append('text')
                .attr('x', function() { return stepstart(baseDataItem); })
                .attr('y', function() { return baseDataItem.track * 50 + 15; })
                .attr('style', 'font-family: \'glyphicons\'')
                .text('\u0001')


            svg.selectAll('rect.expand')
                .transition()
                .attr('y', function() { return baseDataItem.track * 50 + 49; })
                .attr('height', 100)
                .attr('width', 500);
        }
    };

    // binds tracks data once
    svg.selectAll('rect.step')
        .data(trackdata)
        .enter().append('rect')
            .attr('class', 'step')
            .attr('track', function(d) { return d.track; })
            .attr('x', stepstart)
            .attr('y', function(d, i) { return d.track * 50 + 15; })
            .attr('width', stepwidth)
            .attr('height', 30)
            .attr('fill', function(d) { return d.color; })
            .on('click', clickStep);

    // call after setting domain, to update visuals
    var update = function(options) {

        var weekBoxes = generateWeeks();

        var weeknrText = function(d) { return 'UGE ' + moment(d.start).isoWeek(); };
        var datespanText = function(d) {
            return moment(d.start).format('DD-MM-YYYY') + ' - ' + 
                moment(d.start).hours(6*24).format('DD-MM-YYYY'); 
        };

        var weeks = svg.selectAll('g.week-boxes')
            .data(weekBoxes, function(d) { return d.start; });

        weeks.selectAll('rect').attr('x', stepstart);
        weeks.selectAll('text.box').attr('x', stepmidweek);
        weeks.selectAll('text.datespan').attr('x', stepmidweek);
        weeks.selectAll('text.days').transition().attr('x', stepstart);

        // we dont use transform on g because we want different animation behaviour for sub elements
        var weekElm = weeks.enter()
            .append('g')
            .attr('class', 'week-boxes');

        weekElm.append('rect')
            .attr('x', stepstart)
            .attr('y', calendarHeight - weekboxHeight)
            .attr('width', stepweek)
            .attr('height', weekboxHeight)
            .attr('fill', '#eee');

        weekElm.append('text')
            .attr('class', 'box')
            .attr('text-anchor', 'middle')
            .attr('x', stepmidweek)
            .attr('y', calendarHeight - weekboxHeight + 27)
            .text(weeknrText);

        weekElm.append('text')
            .attr('class', 'datespan')
            .attr('text-anchor', 'middle')
            .attr('x', stepmidweek)
            .attr('y', calendarHeight - weekboxHeight + 48)
            .text(datespanText);

        weekElm.append('text')
            .attr('class', 'days')
            .attr('x', stepstart)
            .attr('y', calendarHeight - weekboxHeight - 5)
            .text('M T O T F L S');

        // axis panning from https://gist.github.com/phoebebright/3098488
        if (options.panned) {
            svg.selectAll('rect.step')
                .transition()
                .attr('x', function(d) { return xScale(d.start); });
        }
        weeks.exit().remove();
    };

    var panHandler = function(e) {
        var left = e.target.id === 'pan-left';
        var curr = xScale.domain();
        xScale.domain([
            moment(curr[0]).hours((left?-1:1)*7*24).toDate(),
            moment(curr[1]).hours((left?-1:1)*7*24).toDate()
        ]);

        update({panned: true});
    };

    document.getElementById('pan-left').addEventListener('click', panHandler);
    document.getElementById('pan-right').addEventListener('click', panHandler);

    // call update to render initial weeks
    update({});
    // add last to ensure it stacks ontop of others 
    svg.append('g').attr('class', 'step-expand');
};

var chart = new Chart(data, 'calendar');