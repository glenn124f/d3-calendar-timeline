function ChartDetails(options) {
    ChartEvents.call(this, options);
    var self = this;

    var currentTransform = function() {
        return 'translate(100, 20)';
    };

    var bindDetails = function(step, className) {
        var g = self.svg.details.select('g.' + className + ' g.dynamic');
        g.select('*').remove(); // clears content
        g.append('text').text(step.label)
    };

    var stepClickHandler = function(d) {
        // render the focused path first
        bindDetails(d, 'current');
        self.updateDetails({duration: 1, step: d});
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
        requestAnimationFrame(function() {
            self.update({type: isMonths ? 'zoom-in-details' : 'details', duration: 500 });
            self.updateDetails({});
        });
    };

    var focusPathDefinitions = function(step) {
        var startX = self.scale.x(step.start);
        var endX = self.scale.x(step.end);
        var upperY = 111;
        var bottomY = upperY + self.style.stepHeight;
        var dl = 'M 100 0 L 100 80 L {0} {1} L {2} {3} L 100 0'.f(
            startX, bottomY, 
            startX, upperY
        );
        var dr = 'M 900 0 L 900 80 L {0} {1} L {2} {3} L 900 0'.f(
            endX, bottomY, 
            endX, upperY
        );
        var mt = 'M {0} {1} L {2} {3}'.f(
            startX, upperY,
            endX, upperY
        );

        return [dl, dr, mt];
    };

    var upperY = 81;
    var bottomY = upperY + self.style.stepHeight;
    
    self.updateDetails = function(options) {
        var active = self.state.activeTrack;
        
        var ic1 = self.svg.icons;
        var ic2 = self.svg.details.select('g.details-icons');
        var curr = self.svg.details.select('g.current');

        if (options.step) {
            var fadeIn = options.step ? ic2 : ic1; 
            var hide = options.step ? ic1 : ic2;
            hide
                .style('display', 'none');
            fadeIn
                .select('g.details-icons')
                .style('opacity', 0)
                .style('display', 'block')
                .transition()
                .style('opacity', 1);
        } else {
            var show = active ? ic2 : ic1;
            var hide = active ? ic1 : ic2;
            var current = active || options.step ? 'block' : 'none';
            show.style('display', 'block');
            hide.style('display', 'none');
            curr.style('display', current);
        }
    };

    self.constructDetailsUi = function() {
        // hook click handler on generated steps
        self.svg.steps
            .selectAll('rect, text')
            .on('click', stepClickHandler);

        self.svg.details
            .append('g')
            .attr('class', 'current')
            .attr('transform', currentTransform)
            .append('g')
            .attr('class', 'dynamic');

        var icons = self.svg.details
            .append('g')
            .attr('class', 'details-icons')
            .attr('transform', 'translate({0}, 0)'.f(self.style.width))
        
        icons
            .append('text')
            .attr('x', -42)
            .attr('y', self.style.iconOffset)
            .attr('class', 'ui-icon')
            .text('\ue198')
            .html('&#xe198; <title>Luk detaljevisning</title>')
            .on('click', function() {
                self.state.activeTrack = null;
                self.state.activeStep = null;
                self.update({});
            });
    };

    self.init();
}
ChartDetails.prototype = Object.create(ChartEvents.prototype);

var chart = new ChartDetails({elmId: 'calendar', data: generateData()});