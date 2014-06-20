Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

var md = function(n) { // makes dates ...
    var now = new Date().getTime();
    return new Date().setTime(now-(n*24*60*60*1000));
};

var data = [
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
var weekBoxes = [];

var today = new Date();
var weekMs = 7*24*60*60*1000;
var fourWeeks = new Date();
fourWeeks.setTime(today.getTime()-(4*weekMs));

// generate week boxes
var weekStart = new Date(d3.min(data, function(d) { return d.start; }));
var weekEnd = new Date(d3.max(data, function(d) { return d.end; }));
weekStart.setDate(weekStart.getDate()-weekStart.getDay()); // rewind to monday
while(weekStart.getTime() < weekEnd.getTime()) {
    weekBoxes.push({
        start: new Date(weekStart),
        end: new Date(weekStart.getTime()+weekMs),
    })
    weekStart.setTime(weekStart.getTime()+weekMs);
}

var width = 1000;
var height = 200;
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

x.domain([fourWeeks, today]);
y.domain([0, 2]);

var daysAxis = d3.svg.axis()
    .scale(x)
    .orient('top')
    .ticks(d3.time.days, 1)
    .tickPadding(0)
    .tickFormat(function(d) { return (['M', 'T', 'O', 'T', 'F', 'L', 'S'])[d.getDay()]; })
    .tickSize(0);

var svg = d3.select("body")
             .append("svg")
             .attr("width", width)
             .attr("height", height);

svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, ' + (height - 65) + ')')
    .call(daysAxis);
// shift days over a tiny bit ...
svg.select('.x-axis').selectAll('text').attr('x','8');

svg.selectAll('rect.bars')
    .data(data)
    .enter().append('rect')
        .attr('class', 'bars')
        .attr('x', function(d) { return x(d.start); })
        .attr('y', function(d, i) { return d.track * 50 + 15; })
        .attr('width', function(d) { return x(d.end) - x(d.start) - 4; })
        .attr('height', 30)
        .attr('fill', function(d) { return d.color; });

var weekElm = svg.selectAll('rect.week-boxes')
    .data(weekBoxes)
    .enter().append('g').attr('class', 'week-boxes');

weekElm.append('rect')
    .attr('x', function(d) { return x(d.start); })
    .attr('y', height-60)
    .attr('width', function(d) { return x(d.end) - x(d.start) - 4; })
    .attr('height', 60)
    .attr('fill', '#eee');

weekElm.append('text')
    .attr('x', function(d) { return x(d.start) + 90; })
    .attr('y', height-30)
    .attr('width', function(d) { return x(d.end) - x(d.start) - 4; })
    .attr('height', 60)
    .text(function(d) { return 'UGE ' + d.start.getWeek(); });


var panHandler = function(e) {
    // updating data http://pothibo.com/2013/09/d3-js-how-to-handle-dynamic-json-data/
    // axis panning from https://gist.github.com/phoebebright/3098488
    var left = e.target.id === 'pan-left';
    var curr = x.domain();
    var shift = weekMs * (left?1:-1);
    curr[0].setTime(curr[0].getTime() - shift);
    curr[1].setTime(curr[1].getTime() - shift);
    x.domain(curr);

    svg.selectAll('rect.bars, g.week-boxes rect')
        .transition()
        .attr('x', function(d) { return x(d.start); });
    
    svg.selectAll('g.week-boxes text')
        .transition()
        .attr('x', function(d) { return x(d.start) + 90; });
    
    svg
        .select('.x-axis')
        .transition()
        .call(daysAxis)
        .selectAll('text').attr('x','8');

};

document.getElementById('pan-left').addEventListener('click', panHandler);
document.getElementById('pan-right').addEventListener('click', panHandler);
