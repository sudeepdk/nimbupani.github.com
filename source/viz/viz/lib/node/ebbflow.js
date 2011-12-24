var twitter = require('ntwitter');
var fs = require('fs');
var moment = require('moment');
var async = require('async');

var tweetcount = 10;

var paths = {
  'twitter': 'http://twitter.com/divya/status/',
  'output': './json/ebbflow.json'
}

var tweet = new twitter({
    consumer_key: 'sxAOS9rRnYXALSLDlLJdWA',
    consumer_secret: 'Z8XKjZikIuWIslumVfmiM191tpgo3NuIRuXFESJeo',
    access_token_key: '66682221-zOHqwarDJ9ZCqAe696joyulST5LR5mVvOA0kpwpNs',
    access_token_secret: '18LvO3zxhXoqZ0VnMYWDnqwXic3antaph6k7wPPQ'
}).verifyCredentials(function(err, data) {
    if (err) {
        console.log("Error verifying credentials: " + err);
        process.exit(1);
    }
});

tweet.get('/statuses/user_timeline.json', {
    'screen_name': 'divya',
    'count': tweetcount,
    'trim_user': 'true',
    'exclude_replies': 'true'
},
function(err, stream) {
    async.map(stream,
      // iterator
    function(tweet_, callback) {
        var tweetLite = {};
        tweetLite.permalink = paths.twitter + tweet_.id_str;
        tweetLite.created_at = tweet_.created_at;
        tweetLite.id = tweet_.id_str;
        tweetLite.text = tweet_.text;

        tweet.get('/statuses/retweets/' + tweetLite.id + '.json', {
            'trim_user': 'true'
        },
        function(err, stream) {
            if (err) {
                callback(err);
                return;
            }

            tweetLite.numRetweets = stream.length;
            var timeDeltas = stream.map(function(t) {
                return moment(t.created_at).diff(tweetLite.created_at, 'hours');
            });

            hourlyRetweetCount = {};

            timeDeltas.forEach(function(d) {
                hourlyRetweetCount[d] = (hourlyRetweetCount[d] || 0) + 1;
            });

            tweetLite.hourlyRetweetCount = hourlyRetweetCount;

            callback(null, tweetLite);
        });
    },
    // callback
    function(err, twitterjson) {
        if (err) {
            console.log("Screwed!", err);
        } else {
          twitterjson.sort(function(a,b) {
            return Date.parse(a.created_at) > Date.parse(b.created_at);
          });
            fs.writeFileSync(paths.output, JSON.stringify(twitterjson));
        }
    });
});





