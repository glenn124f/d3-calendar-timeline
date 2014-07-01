function ChartEvents(options) {
    ChartTimeline.call(this, options);
    var self = this;

    self.dragHandler = function() {
        if (self.state.initialX === null) {
            self.svg.root.attr('dragging', 'true');
            self.state.initialX = d3.event.sourceEvent.screenX;
        }
        var offset = self.state.initialX - d3.event.sourceEvent.screenX;
        var domain = self.scale.x.domain();
        var domainDays = 4*7;
        if (!self.isWeeks()) {
            // this is more complex (months differ in length, leap year trololo)
            domainDays = moment(domain[1]).diff(moment(domain[0]), 'days');
        }
        var offsetTime = domainDays*24*60*60*1000/self.style.width*offset;
        // time/pix density 
        var start = moment(domain[0]).milliseconds(offsetTime);
        var end = moment(domain[1]).milliseconds(offsetTime);

        if (d3.event.type === 'dragend') {
            self.state.initialX = null;
            self.setScrolled(true);
            self.svg.root.attr('dragging', null);
            self.svg.scrollbox.attr('transform', 'translate(0, 0)');
            self.scale.x.domain([start.toDate(), end.toDate()]);
            self.update({duration: 1});
        } else {
            self.svg.scrollbox.attr('transform', 'translate(' + -offset + ', 0)');
        }
    };

    self.dragBehavior = d3.behavior.drag()
        .on('drag', self.dragHandler)
        .on('dragend', self.dragHandler);

    var weekHtml = '&#xe237; <title>Ugevisning</title>';
    var monthHtml = '&#xe238; <title>Månedsvisning</title>';

    self.iconZoomClick = function() {
        d3.select(this).html(self.isWeeks() ? weekHtml : monthHtml);
        self.domainToggle();
        self.update({zoomEvent: true});
    };

    self.iconResetClick = function() {
        self.scale.x.domain(self.isWeeks() ? self.domainDefaults.weeks : self.domainDefaults.months);
        self.setScrolled(false);
        self.update({});        
    };

    self.constructEventsElm = function() {
        // rect that handles dragging
        self.svg.root.append('rect')
            .attr('class', 'dragbox')
            .attr('width', self.style.width)
            .attr('height', self.style.timelineHeight + 30)
            .attr('y', self.style.height - self.style.timelineHeight - 15)
            .attr('fill', 'transparent')
            .call(self.dragBehavior);    

        // toggles months/weeks
        self.svg.icons.append('text')
            .attr('x', -42)
            .attr('y', self.style.iconOffset)
            .attr('class', 'icon')
            .html(monthHtml)
            .on('click', self.iconZoomClick);

        // resets to default view
        // show after movement
        self.svg.icons.append('text')
            .attr('x', -40)
            .attr('y', self.style.iconOffset + 40)
            .attr('class', 'icon reset-view')
            .style('display', 'none')
            .html('&#xe435; <title>Gå til til dags dato</title>')
            .on('click', self.iconResetClick);
    };

    // start building elements
    self.constructTimelineSvg();
    self.constructEventsElm();
    // run once to draw initial dynamic data (timeline)
    self.update({duration: 1});

}
ChartEvents.prototype = Object.create(ChartTimeline.prototype);

var chart = new ChartEvents({elmId: 'calendar', data: generateData()});