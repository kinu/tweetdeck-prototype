var columnUtils = require('./column-utils');
var TimelineStore = require('../timeline-store');
var TweetColumnItem = require('./tweetcolumnitem');
var { Request } = require('../request-result');
var IDBKeyValueStore = require('../idb-key-value-store');
var IDBOrderedStore = require('../idb-ordered-store');
var TweetStore = require('../tweet-store');

const update = require('react/addons').addons.update;

class Column {
  constructor(type, account) {
    this.type = type;
    this.updating = false;
    this.title = columnUtils.getTitle(this.type);
    this.account = account;
    this.tweetChangeListeners = [];

    this.timelineStore = new TimelineStore({
      orderedStore: new IDBOrderedStore(),
      tweetStore: new TweetStore({
        keyValueStore: new IDBKeyValueStore()
      })
    });

    this.timelineStore.addTweetChangeListener(tweet => {
      this.tweetChangeListeners.forEach(listener => {
        listener(new TweetColumnItem(tweet));
      });
    });

    window.timelineStore = this.timelineStore;
  }

  load(opts={}) {
    return this.timelineStore
      .fetch(new Request(this.account, opts.cursor))
      .then(requestResult => {
        return {
          items: requestResult.result.map(data =>
            new TweetColumnItem(data)
          ),
          containsGap: requestResult.data.containsGap,
          cursors: requestResult.data.cursors
        };
      });
  }

  addTweetChangeListener(listener) {
    this.tweetChangeListeners.push(listener);
  }

  favoriteTweet(tweet) {
    var sourceTweet = tweet.source;
    const favorited = sourceTweet.favorited;
    const diff = favorited ? -1 : 1;
    const updatedTweet = update(sourceTweet, {
      favorite_count: {$apply: (i) => i + diff},
      favorited: {$set: !favorited}
    });
    return this.timelineStore.favoriteTweet(
      new Request(
        this.account,
        { query: { id: updatedTweet.id_str } },
        updatedTweet
      )
    );
  }

  retweetTweet(tweet) {
    var sourceTweet = tweet.source;
    const retweeted = sourceTweet.retweeted;
    const diff = retweeted ? -1 : 1;
    const updatedTweet = update(sourceTweet, {
      retweet_count: {$apply: (i) => i + diff},
      retweeted: {$set: !retweeted}
    });
    return this.timelineStore.retweetTweet(
      new Request(
        this.account,
        { params: { id: updatedTweet.id_str } },
        updatedTweet
      )
    );
  }
}

module.exports = Column;
