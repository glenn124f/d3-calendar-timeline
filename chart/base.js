// Contains base variables and state, along with scale and constructor functions,
// which also contains most formatting/presentations parameter constants.
function ChartBase(options) {
    var self = this; // alias for closures

    self.elmId = options.elmId;
    self.monthInDays = 122;
    self.trackCount = 0;
    for (var i = 0; i < options.data.length; i++) {
        if (self.trackCount < options.data[i].track + 1) {
            self.trackCount = options.data[i].track + 1;
        }
    }

    self.state = {
        weeks: true, // false = months
        scrolled: false,
        activeTrack: null,
        activeStep: null,
        initialX: null
    };

    var weekStart = moment().startOf('week').add('days', -7);
    var monthStart = moment().startOf('month').add('months', -1);

    // 0:weeks, 1:months
    self.domainDefaults = {
        weeks: [weekStart.toDate(), moment(weekStart).add('weeks', 4).toDate()],
        months: [monthStart.toDate(), moment(monthStart).add('days', self.monthInDays)]
    };

    self.style = {
        width: 1000,
        height: 250,
        timelineHeight: 60,
        timelineOffsetVert: 20,
        detailsBoxHeight: 60,
        padding: 4,
        stepsOffsetVert: 50,
        stepPaddingVert: 5,
        stepHeight: 35,
        iconOffset: 40,
        durationDefault: 250
    };

    self.scale = {
        x: d3.time.scale().range([0, self.style.width]),
        y: d3.scale.linear().range([self.style.height, 0])
    };

    self.scale.x.domain(self.domainDefaults.weeks);
    self.scale.y.domain([0, 3]);

    var root = d3.select('#' + self.elmId).append('svg')
        .attr('width', self.style.width)
        .attr('height', self.style.height);

    var scrollbox = root.append('g').attr('class', 'scrollbox');
    var weeks = scrollbox.append('g').attr('class', 'week-container');
    var months = scrollbox.append('g').attr('class', 'month-container');
    var ticks = scrollbox.append('g').attr('class', 'tick-container');
    var details = root.append('g').attr('class', 'details-container');
    var icons = root.append('g')
        .attr('class', 'icon-container')
        .attr('transform', 'translate('+ (self.style.width) +', 0)');

    self.svg = {
        root: root,
        scrollbox: scrollbox,
        weeks: weeks,
        months: months,
        ticks: ticks,
        icons: icons,
        details: details
    };

    // main animation.
    self.update = function(options) {
        self.updateDetails(options);
        self.updateTimeline(options);
    };

    // called by the first object in the prototype chain. 
    // ensures all objects are fully parsed
    self.init = function() {
        // start building elements
        self.constructTimelineUi();
        self.constructEventsUi();
        self.constructDetailsUi();        
        self.update({type: 'render'});
    };

    self.isWeeks = function() {
        return self.state.weeks;
    };

    self.isMonths = function() {
        return !self.isWeeks();
    };

    self.isScrolled = function() {
        return self.state.scrolled;
    };

    self.setWeeks = function(weeks) {
        self.state.weeks = weeks;
    };

    self.setScrolled = function(scroll) {
        self.state.scrolled = scroll;
    };

    self.generateTimelineUnits = function(months, ticks) {
        var units = [];
        var current = self.scale.x.domain();

        // add x weeks padding to the durrent domain, can be scrolled into view by drag
        var padding = 15;
        var factor = 2; 
        var domainUnit = months ? 'months' : 'weeks';
        var start = moment(current[0]);
        if(!months) {
            start.startOf('week').add('weeks', -padding);
        } else {
            start.startOf('month').add('months', -padding);
        }
        if (ticks && !months) {
            start.add('weeks', -padding);
            factor = 8;
        }
        var added = 0;
        while (added < padding*factor+4) {
            units.push({
                start: moment(start).toDate(),
                startM: moment(start),
                end: moment(start).add(domainUnit, 1).toDate(),
                endM: moment(start).add(domainUnit, 1)
            });
            start.add(domainUnit, 1);
            added++;
        }
        return units;
    };

    self.midDate = function(start, end) {
        var s = start.isAfter ? start : moment(start);
        var e = end.isAfter ? end : moment(end);
        var diff = e.diff(s, 'hours') / 2;
        // this always adds whole number of days
        return s.add('hours', diff);
    };

    self.updateActiveStep = function() {
        var t = self.state.activeTrack;
        if (t) {
            var domain = self.scale.x.domain();
            var mid = self.midDate(domain[0], domain[1]);
            var item = null;
            for(var i = 0; i < t.data.length; i++) {
                var s = t.data[i];

                if (s.startM.isBefore(mid) && s.endM.isAfter(mid)) {
                    item = s;
                    break;
                }
            }
            if (item) {
                self.state.activeStep = item;
            }
        }
    };

    self.weeknrText = function(d) { 
        return 'UGE ' + moment(d.start).isoWeek(); 
    };
    
    self.monthText = function(d) {
        return moment(d.start).format('MMMM').toUpperCase();
    };
    
    self.yearText = function(d) {
        return moment(d.start).format('YYYY');
    };
    
    self.datespanText = function(d) {
        return moment(d.start).format('DD-MM-YYYY') + ' - ' + 
            moment(d.start).add('days', 6).format('DD-MM-YYYY'); 
    };

    self.stepstart = function(d) { 
        return self.scale.x(d.start); 
    };

    self.textStepstart = function(d) {
        return self.stepstart(d) + 5;
    };
    
    self.stepwidth = function(d) {

        return self.scale.x(d.end) - self.scale.x(d.start) + 0.3; // removes figde of pixel gap 
    };
    
    self.timelineStepwidth = function(d) {
        return self.scale.x(d.end) - self.scale.x(d.start) - 3;
    };
    
    self.stepmidweek = function (d) {
        return self.scale.x(moment(d.start).add('hours', 3.5*24).toDate());
    };
    
    self.stepweek = function(d) {
        return self.scale.x(moment(d.start).add('days', 7).toDate()) - self.scale.x(d.start) - self.style.padding;
    };

    self.stepsTransform = function(d) {
        var s = self.style;
        var y = s.stepsOffsetVert + (d.track * s.stepHeight) + (d.track * s.stepPaddingVert);
        var transform = 'translate({0}, {1})'.f(self.scale.x(d.start), y);
        return transform;
    };

    self.timelineY = function() {
        var s = self.style;
        var stepHeights = s.timelineOffsetVert + s.stepsOffsetVert + 
            self.trackCount * (s.stepHeight + s.stepPaddingVert); 
        return stepHeights;        
    };

    self.activeTransform = function(d) {
        var s = self.style;
        var n = self.trackCount-1;
        var y = s.stepsOffsetVert + (n * s.stepHeight + n * s.stepPaddingVert);
        var transform = 'translate({0}, {1})'.f(self.stepstart(d), y);
        return transform;
    };
    
    self.timelineTransform = function(d) {
        return 'translate({0}, {1})'.f(self.stepstart(d), self.timelineY());
    };

    self.generateWeekbox = function() {
        var weekElm = this
            .append('g')
            .attr('class', 'week-box')
            .attr('transform', self.timelineTransform);

        weekElm.append('rect')
            .attr('class', 'background')
            .attr('width', self.timelineStepwidth)
            .attr('height', self.style.timelineHeight)
            .attr('fill', '#eee');

        weekElm.append('text')
            .attr('class', 'weeknr-text')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 27)
            .text(self.weeknrText);

        weekElm.append('text')
            .attr('class', 'datespan')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 48)
            .text(self.datespanText);

        weekElm.append('text')
            .attr('class', 'days')
            .attr('y', - 5)
            .text('M T O T F L S');
    };
    
    self.generateMonthbox = function() {
        var monthElm = this
            .append('g')
            .attr('class', 'month-box')
            .attr('transform', self.timelineTransform);

        monthElm
            .append('rect')
            .attr('class', 'background')
            .attr('width', self.timelineStepwidth)
            .attr('height', self.style.timelineHeight)
            .attr('fill', '#eee');

        monthElm.append('text')
            .attr('class', 'month-text')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 27)
            .text(self.monthText);

        monthElm.append('text')
            .attr('class', 'year-text')
            .attr('text-anchor', 'middle')
            .attr('x', 125)
            .attr('y', 48)
            .text(self.yearText);
    };

    self.stepTextDisplay = function(d) {
        return d.endM.diff(d.startM, 'days') < 2 ? 'none' : 'block';
    };

    self.stepTextDisplayInv = function(d) {
        return d.endM.diff(d.startM, 'days') < 2 ? 'block' : 'none';
    };

    var clipIds = 0;
    self.generateStepElm = function() {
        // for clipping the text
        this.append('defs')
            .append('clipPath')
            .attr('id', function(d) {
                d.clipPathId = clipIds++;
                return 'step-clip-' + d.clipPathId;
            })
            .append('rect')
            .attr('width', self.stepwidth)
            .attr('height', self.style.stepHeight * 10); // dont clip downwards

        this.attr('class', 'step-box')
            .attr('track', function(d) { return d.track; })
            .attr('transform', self.stepsTransform)
            .attr('clip-path', function(d) {
                return 'url(#step-clip-{0})'.f(d.clipPathId);
            });

        this.append('rect')
            .attr('width', self.stepwidth)
            .attr('height', self.style.stepHeight)
            .attr('fill', function(d) { return d.color; });

        this.append('rect')
            .attr('class', 'highlight')
            .attr('width', self.stepwidth)
            .attr('height', 2)
            .attr('y', self.style.stepHeight);

        this.append('text')
            .attr('class', 'label')
            .attr('x', 10)
            .attr('y', 23)
            .style('display', self.stepTextDisplay)
            .text(function(d) { return d.label; });

        this.append('text')
            .attr('class', 'icon')
            .attr('x', 10)
            .attr('y', 24)
            .style('display', self.stepTextDisplayInv)
            .text('\ue319');
    };

}