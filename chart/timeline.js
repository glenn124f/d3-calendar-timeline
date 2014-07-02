function ChartTimeline(options) {
    ChartBase.call(this, options);
    var self = this;

    self.update = function(options) {
        // hide/show reset icon
        self.svg.icons.selectAll('text.reset-view')
            .style('display', self.isScrolled() ? 'block' : 'none');

        // render skips all animations
        var duration = options.type === 'render' ? 1 : 
            (options.type && options.type.indexOf('scroll') === 0) ? 100 : 250;
        
        // timeline data
        var weekData = self.generateTimelineUnits();
        var monthData = self.generateTimelineUnits(true, false);
        var weekTickData = self.generateTimelineUnits(false, true);

        var weeks = self.svg.weeks.selectAll('g.week-box');
        var months = self.svg.months.selectAll('g.month-box');
        var ticks = self.svg.ticks.selectAll('g.tick-box');

        // bind appropiate domain data
        if (self.isWeeks()) {
            weeks = weeks.data(weekData, function(d) { return d.start; });
            weeks.enter().call(self.generateWeekbox);
            weeks.exit().remove();
        } else {
            months = months.data(monthData, function(d) { return d.start; });
            months.enter().call(self.generateMonthbox);
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
        if (options.type === 'zoom-in' && self.isWeeks()) {
            // from months to weeks
            weeks
                .style('display', 'block')
                .attr('transform', self.defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(duration)
                .style('opacity', 1);
            months
                .style('display', 'none');
            ticks
                .style('display', 'none');
        } else if (options.type === 'zoom-out') {
            // from weeks to months
            months
                .style('display', 'block')
                .attr('transform', self.defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(duration)
                .style('opacity', 1);
            ticks
                .style('display', 'block')
                .attr('transform', self.defaultTransform)
                .style('opacity', 0) // sets up animation
                .transition()
                .duration(duration)
                .style('opacity', 1);

            weeks
                .style('display', 'none');
        } else if (self.isWeeks()) {
            // weeks animation
            weeks
                .transition()
                .duration(duration)
                .attr('transform', self.defaultTransform);
        } else {
            // months animation
            months
                .transition()
                .duration(duration)
                .attr('transform', self.defaultTransform);
            ticks
                .transition()
                .duration(duration)
                .attr('transform', self.defaultTransform);
        }
        // main step animations. use filters to implement conditional animations

        var trackNr = self.state.activeTrack && self.state.activeTrack.nr;
        var trackDefined = typeof trackNr === 'number';
        var trackFilter = '[track="{0}"]'.f(trackNr);
        var filter = {
            active: trackDefined ? trackFilter : ':not(*)',
            others: trackDefined ? ':not({0})'.f(trackFilter) : ':not(*)',
            all: trackDefined ? ':not(*)' : '*'
        };
        
        var steps = self.svg.steps
            .transition()
            .duration(duration);

        steps
            .filter(filter.all)
            .attr('transform', self.stepsTransform)
            .selectAll('rect')
            .attr('width', self.stepwidth);

        steps
            .filter(filter.active)
            .attr('transform', self.detailsTransform)
            .selectAll('rect')
            .attr('width', self.stepwidth);

        steps
            .filter(filter.others)
            .style('display', 'none');
            
    };

    self.constructTimelineUi = function() {
        // tracks data
        self.svg.steps = self.svg.scrollbox.selectAll('g.step')
            .data(options.data)
            .enter().append('g').call(self.generateStepElm);
    };
};
ChartTimeline.prototype = Object.create(ChartBase.prototype);
