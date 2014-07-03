var loremipsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam id eleifend risus, nec auctor nibh. Pellentesque dapibus ullamcorper dapibus. Fusce rutrum placerat adipiscing. Nam eros lectus, tempus sed malesuada at, convallis et quam. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec molestie ut lectus vel commodo. Phasellus molestie rutrum euismod. Sed volutpat pharetra aliquam. Sed pharetra velit in nunc pretium, vel euismod diam pharetra. Vestibulum non ligula vitae massa imperdiet ultrices non in augue. In mattis sapien eget est adipiscing ultrices. Donec sodales vulputate tortor et fringilla. Vivamus ut adipiscing eros, ac convallis risus. Fusce adipiscing vel est sit amet dictum. Praesent sit amet ipsum tellus. Vestibulum viverra accumsan tortor vitae sollicitudin. Ut aliquam tellus vitae auctor euismod. Suspendisse facilisis justo ac rutrum porta. Mauris aliquam turpis at hendrerit mollis. Sed in blandit orci. Curabitur luctus accumsan scelerisque. Cras mi libero, sodales non ullamcorper consectetur, suscipit in orci. Mauris ultrices viverra tortor, id euismod nisl ultrices ut. Quisque sed tellus at lectus volutpat viverra ut quis metus. Nunc fringilla velit tincidunt ipsum viverra dapibus. Sed faucibus sapien a diam sollicitudin dapibus. Fusce ac risus rutrum, consequat justo nec, posuere leo. Nullam sodales et erat non placerat. Ut dictum purus ut facilisis aliquet. Fusce pretium tristique ultrices. Mauris vel dolor adipiscing, lobortis ligula quis, posuere orci. Praesent tincidunt tellus sit amet urna sodales, non viverra metus vehicula. Nunc porttitor tellus arcu, sit amet cursus tellus fringilla vitae. Aliquam eleifend molestie ligula at vehicula. Donec sit amet suscipit augue. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Quisque ut quam accumsan, aliquet libero sed, semper felis. Sed faucibus odio et felis fringilla ornare. Integer porta congue pellentesque. Sed eget blandit velit, et fermentum sem. Maecenas dictum augue nec leo mattis sagittis. Mauris est magna, condimentum vel nibh in, semper facilisis lectus. Curabitur semper mollis massa eu pharetra. Mauris posuere facilisis fringilla. Aliquam a mattis urna. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Morbi ac augue quis orci fringilla iaculis vitae eu nibh. Aliquam volutpat posuere sapien, vitae egestas dui fermentum a. Ut ante ante, accumsan ut risus nec, interdum ullamcorper lacus. Mauris ornare id odio auctor fringilla. Mauris aliquam risus ante, non pharetra lectus porttitor egestas. Etiam et dui sem. Aliquam consequat metus et ornare ultricies. Nulla eu sapien odio. Maecenas nec magna dui. Morbi pharetra massa sit amet ligula fringilla tristique. Nulla ullamcorper nibh non euismod posuere. Donec posuere eget quam vel pretium. Maecenas congue magna dolor, in aliquet odio pulvinar sit amet. Morbi consequat elit vitae pulvinar tincidunt. Nunc imperdiet vehicula odio, non iaculis risus eleifend a. Nullam auctor aliquam commodo. Maecenas varius eros nec elit lacinia dictum. Curabitur nec eleifend nulla. Nulla blandit dui in mauris sodales, ut mollis magna tempus. Proin lobortis, enim ut cursus ullamcorper, est dolor interdum turpis, sit amet elementum risus massa feugiat mi. Maecenas pharetra urna ut odio aliquam, sed iaculis libero dictum. Integer arcu metus, pharetra nec hendrerit vitae, adipiscing sit amet est. Pellentesque pharetra purus at pharetra venenatis. Duis laoreet vitae augue eu tincidunt. In hac habitasse platea dictumst. Aenean in nisl nec nunc ultrices tincidunt. Mauris varius ante sed risus faucibus pretium. Maecenas at pharetra ligula. Cras turpis mauris, egestas quis turpis eget, hendrerit blandit lectus. Vivamus luctus dignissim risus, vitae euismod dui. Phasellus ut vestibulum lacus, eu aliquet tortor. Maecenas vel lobortis urna. Praesent et ante ut erat dictum interdum quis nec quam. Aliquam vestibulum lectus vel consectetur ornare. Praesent lobortis consequat leo nec posuere. In varius arcu in sem bibendum, in viverra risus malesuada. Nunc turpis risus, placerat et volutpat in, sagittis nec neque. Duis rhoncus massa sed rutrum pulvinar. Aliquam sollicitudin purus a consectetur consectetur. Curabitur tincidunt vitae ante ut auctor. In auctor sit amet diam vitae imperdiet. Nunc auctor accumsan condimentum. Aenean id urna facilisis, consectetur est sed, rhoncus massa. Suspendisse malesuada fringilla nisi, eu rutrum eros viverra in. Vivamus viverra porta molestie. Nulla vel augue ultricies, vehicula lacus vel, vestibulum velit. Donec turpis nunc, egestas vel sodales a, interdum eu urna. Maecenas placerat massa sit amet magna mollis, sed rhoncus sapien imperdiet. Nunc condimentum porta elementum. Fusce nec libero hendrerit, feugiat sem vel, feugiat dolor. Cras at tincidunt purus, pellentesque lacinia tellus. Proin vel lobortis turpis. In sollicitudin tortor ut augue consectetur gravida. Praesent in felis at tellus metus.';

// assume basic unicode plane
var makeLorem = function(length) {
    var start = Math.floor(Math.random() * (loremipsum.length - length * 3));
    while (start < loremipsum.length) {
        var c = loremipsum.charCodeAt(start);
        if (64 < c && c <  90) break;
        start++;
    }
    var end = Math.min(loremipsum.length, start + length);
    var str = loremipsum.substring(start, end);
    return str;
};

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

var staticData = function() {
    var today = moment().startOf('day');
    var nextMonday = moment().add('days', 14).startOf('week');
    console.log('staticdata');
    console.log(today.toString());
    console.log(nextMonday.toString());
    var getData = function(d, label) {
        return [
            {
                start: moment(d).toDate(),
                startM: moment(d),
                end: moment(d).add('days', 3).toDate(), 
                endM: moment(d).add('days', 3),
                color: 'tomato',
                label: label,
                track: 0
            },
            {
                start: moment(d).add('days', -1).toDate(),
                startM: moment(d).add('days', -1),
                end: moment(d).add('days', 1).toDate(), 
                endM: moment(d).add('days', 1),
                color: 'goldenrod',
                label: 'brownish',
                track: 1
            },
            {
                start: moment(d).add('days', -2).toDate(),
                startM: moment(d).add('days', -2),
                end: moment(d).add('days', -1).toDate(), 
                endM: moment(d).add('days', -1),
                color: 'springgreen',
                label: 'greenish',
                track: 2
            }
        ];
    };

    var data = getData(today, 'today').concat(getData(nextMonday, 'a monday'));
    return data;
};

var generateData = function(static) {
    function randomColor(brightness){
      function randomChannel(brightness){
        var r = 255-brightness;
        var n = 0|((Math.random() * r) + brightness);
        var s = n.toString(16);
        return (s.length==1) ? '0'+s : s;
      }
      return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
    }

    if (static) {
        return staticData();
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
                    label: makeLorem(5 + Math.ceil(Math.random()*20)),
                    color: randomColor(200),
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
