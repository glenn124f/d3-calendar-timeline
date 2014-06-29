if (!String.prototype.format) {
  String.prototype.format = String.prototype.f= function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var generateData = function() {
    function randomColor(brightness){
      function randomChannel(brightness){
        var r = 255-brightness;
        var n = 0|((Math.random() * r) + brightness);
        var s = n.toString(16);
        return (s.length==1) ? '0'+s : s;
      }
      return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
    }
    // lots of fudging ...
    var starts = [
        moment().add('days', -Math.round(Math.random()*100)),
        moment().add('days', -Math.round(Math.random()*100)),
        moment().add('days', -Math.round(Math.random()*100))
    ];
    var data = [];
    var maxdays = 200;
    var track = 0;
    for(var i = 0; i < starts.length; i++) {
        var date = moment(starts[i]);
        var start = moment(starts[i]);
        while(date.diff(start, 'days') < maxdays) {
            var tracklen = Math.round(Math.random()*maxdays/2+7);
            while(date.diff(start, 'days') < tracklen) {
                var stepsize = Math.ceil(Math.random()*7);
                if (Math.random()<0.1){
                    stepsize *= 3;
                }
                data.push({
                    start: moment(date).toDate(),
                    startM: moment(date),
                    end: moment(date).add('days', stepsize).toDate(),
                    endM: moment(date).add('days', stepsize),
                    label: 'foo',
                    color: randomColor(50),
                    track: track
                });
                date.add('days', stepsize);
            }
            if (Math.random() > 0.9) {
                break; 
            } else {
                // step some amount of days
                date.add('days', Math.ceil(Math.random()*30))
            }

        }
        track++;
    }
    return data;
};


// generates timeline boxes on the fly ...
var generateTimelineUnits = function(scale, months, ticks) {
    var units = [];
    var current = scale.domain();

    // add x weeks padding to the durrent domain, can be scrolled into view by drag
    var padding = 20;
    var factor = 2; 
    var domainUnit = months ? 'months' : 'weeks';
    var start = moment(current[0]);
    if(!months) {
        start.isoWeekday(1).hours(0).minutes(0).seconds(0).add('weeks', -padding);
    } else {
        start.date(1).hours(0).minutes(0).seconds(0).add('months', -padding);
    }
    if (ticks && !months) {
        start.add('weeks', -padding);
        factor = 8;
    }
    var added = 0;
    while (added < padding*factor+4) {
        units.push({
            start: moment(start).toDate(),
            end: moment(start).add(domainUnit, 1).toDate()
        });
        start.add(domainUnit, 1);
        added++;
    }
    return units;
};

var getMonthDomain = function(weekScale) {
    var domain = weekScale.domain();
    var currentMid = moment(domain[0]).add('days', 14);
    var newStart = moment(currentMid).add('months', -2);
    var newEnd = moment(newStart).add('months', 4);
    return [newStart.toDate(), newEnd.toDate()];
};

var getWeekDomain = function(monthScale) {
    var domain = monthScale.domain();
    var currentMid = moment(domain[0]).add('months', 2);
    var newStart = moment(currentMid).add('weeks', -2);
    var newEnd = moment(newStart).add('weeks', 4);
    return [newStart.toDate(), newEnd.toDate()];        
};
