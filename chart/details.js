function ChartDetails(options) {
    ChartEvents.call(this, options);
    var self = this;

    var stepClickHandler = function(d) {
        var tdata = [];
        for (var i = 0; i < options.data.length; i++) {
            if (options.data[i].track === d.track) {
                tdata.push(options.data[i]);
            }
        }
        self.state.activeTrack = { nr: d.track, data: tdata };
        var x = self.scale.x;
        var midstep = moment(x.invert((x(d.start) + x(d.end)) / 2));
        var domain = x.domain();
        var start = midstep.add('weeks', -2);
        var end = moment(start).add('weeks', 4);
        var isMonths = !self.isWeeks();
        x.domain([start.toDate(), end.toDate()]);
        self.setWeeks(true);
        self.update({type: isMonths ? 'zoom-in-details' : 'details' });
    };

    self.constructDetailsUi = function() {
        self.svg.steps
            .selectAll('rect, text')
            .on('click', stepClickHandler);
    };

        // start building elements
    self.constructTimelineUi();
    self.constructEventsUi();
    self.constructDetailsUi();
    // run once to draw initial dynamic data (timeline)
    self.update({type: 'render'});
}
ChartDetails.prototype = Object.create(ChartEvents.prototype);

var chart = new ChartDetails({elmId: 'calendar', data: generateData()});