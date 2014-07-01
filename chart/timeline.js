function ChartTimeline(options) {
    ChartBase.call(this, options);
    var self = this;

    self.update = function(options) {
        // hide/show reset icon
        self.svg.icons.selectAll('text.reset-view')
            .style('display', self.isScrolled() ? 'block' : 'none');

        // timeline processing
        var weekData = self.generateTimelineUnits();
        var monthData = self.generateTimelineUnits(true, false);
        var weekTickData = self.generateTimelineUnits(false, true);

        var weeks = self.svg.weeks.selectAll('g.week-box');
        var months = self.svg.months.selectAll('g.month-box');
        var ticks = self.svg.ticks.selectAll('g.tick-box');

        // bind appropiate domain data
        if (self.isWeeks()) {
            weeks = weeks.data(weekData, function(d) { return d.start; });
            weeks.enter().call(self.generateWeekBoxes);
            weeks.exit().remove();
        } else {
            months = months.data(monthData, function(d) { return d.start; });
            months.enter().call(self.generateMonthBoxes);
            months.exit().remove();

            ticks = ticks.data(weekTickData, function(d) { return d.start; });
            ticks.enter()
                .append('g')
                .attr('class', 'tick-box')
                .attr('transform', self.defaultTransform)
                .append('text')
                .attr('text-anchor', 'left')
                .attr('x', 0)
                .attr('y', -5)
                .text(function(d) {
                    return moment(d.start).isoWeek();
                });
            ticks.exit().remove();
        }
        if (options.zoomEvent && self.isWeeks()) {
            // from months to weeks
            weeks
                .style('display', 'block')
                .attr('transform', self.defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(options.duration || self.style.durationDefault)
                .style('opacity', 1);
            months
                .style('display', 'none');
            ticks
                .style('display', 'none');
        } else if (options.zoomEvent) {
            // from weeks to months
            months
                .style('display', 'block')
                .attr('transform', self.defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(options.duration || self.style.durationDefault)
                .style('opacity', 1);
            ticks
                .style('display', 'block')
                .attr('transform', self.defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(options.duration || self.style.durationDefault)
                .style('opacity', 1);

            weeks
                .style('display', 'none');
        } else if (self.isWeeks()) {
            // weeks animation
            weeks
                .transition()
                .duration(options.duration || self.style.durationDefault)
                .attr('transform', self.defaultTransform);
        } else {
            // months animation
            months
                .transition()
                .duration(options.duration || self.style.durationDefault)
                .attr('transform', self.defaultTransform);
            ticks
                .transition()
                .duration(options.duration || self.style.durationDefault)
                .attr('transform', self.defaultTransform);
        }

        // main step animation. updates x axis + width accoding to domain
        var steps = self.svg.steps.selectAll('rect.step')
            .transition()
            .duration(options.duration || self.style.durationDefault)
            .attr('x', self.stepstart)
            .attr('width', self.stepwidth);
    };

    self.constructTimelineSvg = function() {
        // tracks data
        self.svg.steps = self.svg.scrollbox.selectAll('g.step')
            .data(options.data)
            .enter().append('g');

        self.svg.steps.append('rect')
            .attr('class', 'step')
            .attr('track', function(d) { return d.track; })
            .attr('x', self.stepstart)
            .attr('y', self.trackY)
            .attr('width', self.stepwidth)
            .attr('height', self.style.stepHeight)
            .attr('fill', function(d) { return d.color; })
            .on('click', self.stepClickHandler);
    };
};
ChartTimeline.prototype = Object.create(ChartBase.prototype);
