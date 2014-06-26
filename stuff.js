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
            console.log('generating', tracklen);
            while(date.diff(start, 'days') < tracklen) {
                var stepsize = Math.ceil(Math.random()*7);
                console.log('adding step', stepsize);
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
    console.log(data)
    return data;
};
