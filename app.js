
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

var data = (function() {
    var md = function(n) {
        return moment().hours(0).minutes(0).seconds(0).hours(-n*24).toDate();
    };
    return [
        {start: md(42), end: md(30), label: 'first', color: 'blue', track: 0 },
        {start: md(30), end: md(20), label: 'second', color: 'pink', track: 0 },
        {start: md(20), end: md(13), label: 'third', color: 'yellow', track: 0 },
        {start: md(13), end: md(10), label: 'fourth', color: 'green', track: 0 },
        {start: md(10), end: md(9), label: 'fifth', color: 'black', track: 0 },

        {start: md(13), end: md(6), label: 'first', color: 'red', track: 1 },
        {start: md(6), end: md(3), label: 'second', color: 'red', track: 1 },
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

    var xScale = d3.time.scale().range([0, calendarWidth]);
    var yScale = d3.scale.linear().range([calendarHeight, 0]);

    // sets default domain
    xScale.domain([domainDefault.start, domainDefault.end]);
    yScale.domain([0, 2]);

    // utilize built in axis for the days line.
    var daysLine = d3.svg.axis()
        .scale(xScale)
        .orient('top')
        .ticks(d3.time.days, 1)
        .tickPadding(0)
        .tickFormat(function(d) { return (['S', 'M', 'T', 'O', 'T', 'F', 'L'])[d.getDay()]; })
        .tickSize(0);

    // initial appending needs to be done once only.
    svg.append('g')
        .attr('class', 'days-line')
        .attr('transform', 'translate(0, ' + (calendarHeight - weekboxHeight - 5) + ')')
        .call(daysLine);

    // generates week boxes on the fly ...
    var generateWeeks = function() {
        var weeks = [];
        var current = xScale.domain();
        // assumes domain is week aligned to a monday
        var start = moment(current[0]).hours(-14*24);
        var end = moment(current[1]).hours(14*24);
        while (start.isBefore(end)) {
            weeks.push({
                start: moment(start).toDate(),
                end: moment(start).hours(7*24).toDate()
            });
            start.hours(7*24);
        }
        return weeks;
    };

    // binds tracks data once
    svg.selectAll('rect.step')
        .data(trackdata)
        .enter().append('rect')
            .attr('class', 'step')
            .attr('x', function(d) { return xScale(d.start); })
            .attr('y', function(d, i) { return d.track * 50 + 15; })
            .attr('width', function(d) { return xScale(d.end) - xScale(d.start) - 4; })
            .attr('height', 30)
            .attr('fill', function(d) { return d.color; });

    // call after setting domain, to update visuals
    var update = function(options) {

        var weekBoxes = generateWeeks();
        var weekNrOffset = 90;

        var weekElm = svg.selectAll('rect.week-boxes')
            .data(weekBoxes)
            .enter().append('g').attr('class', 'week-boxes');

        weekElm.append('rect')
            .attr('x', function(d) { return xScale(d.start); })
            .attr('y', calendarHeight - weekboxHeight)
            .attr('width', function(d) { return xScale(d.end) - xScale(d.start) - 4; })
            .attr('height', weekboxHeight)
            .attr('fill', '#eee');

        weekElm.append('text')
            .attr('x', function(d) { return xScale(d.start) + weekNrOffset; })
            .attr('y', calendarHeight - weekboxHeight + 20)
            .attr('width', function(d) { return xScale(d.end) - xScale(d.start) - 4; })
            .attr('height', weekboxHeight)
            .text(function(d) { return 'UGE ' + d.start.getWeek(); });

        // axis panning from https://gist.github.com/phoebebright/3098488
        if (options.panned) {
            svg.selectAll('rect.step')
                .transition()
                .attr('x', function(d) { return xScale(d.start); });
            
            svg
                .select('.days-line')
                .transition()
                .call(daysLine)
                .selectAll('text')
                .attr('x', 6);
        } else {
            // no transition on initial render
            svg
                .select('.days-line')
                .call(daysLine)
                .selectAll('text')
                .attr('x', 6);
        }
    };

    var panHandler = function(e) {
        var left = e.target.id === 'pan-left';
        var curr = xScale.domain();
        var shift = (7*24*60*60*1000) * (left?1:-1);
        curr[0].setTime(curr[0].getTime() - shift);
        curr[1].setTime(curr[1].getTime() - shift);
        xScale.domain(curr);

        update({panned: true});
    };

    document.getElementById('pan-left').addEventListener('click', panHandler);
    document.getElementById('pan-right').addEventListener('click', panHandler);

    // call update to render initial weeks
    update({});
};

var chart = new Chart(data, 'calendar');