app.service('youtubePlayerApi', ['$window', '$rootScope', '$log', '$q', '$http', function ($window, $rootScope, $log, $q, $http) {
    var service = $rootScope.$new(true);

    // Youtube callback when API is ready
    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        service.ready = true;
        // service.videoId = 'Y6ti5f-LHp4';
        service.loadPlayer();
    };

    service.ready = false;
    service.playerId = null;
    service.player = null;
    service.videoId = null;
    service.playerHeight = '390';
    service.playerWidth = '640';
    service.navStatus = 'active';
    service.youtubeState = 'n/a';

    service.currentIndex = 1;
    service.skip = 0;
    service.limit = 0;
    service.songlist = [];

    service.bindVideoPlayer = function(elementId) {
        $log.info('Binding to player ' + elementId);
        this.playerId = elementId;
    };

    service.createPlayer = function () {
        return new YT.Player(this.playerId, {
            height: this.playerHeight,
            width: this.playerWidth,
            videoId: this.videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'showinfo': 0
            },
            events: {
                'onReady': this.onYoutubeReady,
                'onStateChange': this.onYoutubeStateChange
            }
        });
    };

    service.onYoutubeReady = function() {
        service.navStatus = 'inactive';
        console.log('onYoutubeReady ready!');
    };

    service.fetchVideo = function(channel, order, skip) {
        if(!skip) {
            skip = service.skip;
        }
        order = 'normal';
        var deferred = $q.defer();
        var returnData = [];
        var randomNr;
        var maxRandomNr;
        var data = $http.get('/api/' + channel + '/' + skip).then(function(response) {
            console.log(response, response.data.count);
            _.each(response.data.videos, function(element, index) {
                var song = {};
                song.ytid = element.ytid;
                song.title = element.title;
                console.log("1", song);
                service.songlist.push(song);
            });
            console.log("2", service.songlist);
            returnData.count = response.data.count;
            returnData.trackId = response.data.videos[0].ytid;
            returnData.trackName = response.data.videos[0].title;
            return returnData;
        });
        deferred.resolve(data);
        return deferred.promise;
    };

    service.loadPlayer = function() {
        // API ready?
        if (this.ready && this.playerId) {
            if(this.player) {
                this.player.destroy();
            }
            this.player = this.createPlayer();
        }
    };

    service.onYoutubeStateChange = function(event) {
        console.log(event.data);
        if (event.data === YT.PlayerState.PLAYING) {
            service.youtubeState = 'playing';
            console.log('playing');
        } else if (event.data === YT.PlayerState.PAUSED) {
            console.log('paused');
            service.youtubeState = 'paused';
        } else if (event.data === YT.PlayerState.ENDED) {
            console.log('ended');
            service.youtubeState = 'ended';
        }
        $rootScope.$apply();
    };

    service.getYtState = function() {
        console.log('getYtState runned: ' + service.youtubeState);
        return service.youtubeState;
    };

    service.getSongList = function() {
        return service.songlist;
    };

    // PLAYER FUNCTIONALITIES
    service.playVideoId = function(id) {
        this.player.loadVideoById(id, 0, 0, 'hd720');
    };

    service.togglePlay = function() {
        var state = this.player.getPlayerState();
        console.log(state);
        if(state === 1) {
            this.player.pauseVideo();
            return;
        }
        this.player.playVideo();
    };

    service.nextVideo = function(channel) {
        if (this.navStatus === 'inactive') {
            this.navStatus = 'active';
            console.log('currIndex: ', this.currentIndex, 'songlist len: ', this.songlist.length);
            if (this.currentIndex === this.songlist.length)
            {
                service.skip = service.skip + 5;
                console.log('skip: ', service.skip);
                service.fetchVideo(channel, 'random', service.skip).then(function(result) {
                    service.playVideoId(result.trackId);
                    service.currentIndex++;
                    service.navStatus = 'inactive';
                });
            }
            else {
                console.log('currIndex: ', this.currentIndex, 'songlist len: ', this.songlist.length);
                this.playVideoId(this.songlist[this.currentIndex++].ytid);
                this.navStatus = 'inactive';
            }

        }
        else {
            console.log('is active');
        }

    };

    service.previousVideo = function() {
        if (this.currentIndex > 1) {
            this.currentIndex--;
            var id = this.songlist[this.currentIndex-1].ytid;
            this.player.loadVideoById(id, 0, 0, 'hd720');
        }
    };

    return service;
}]);

app.service('channelListModel', ['$window', '$rootScope', '$log', '$q', '$http', function ($window, $rootScope, $log, $q, $http) {
    var deferred = $q.defer();
    var data = $http.get('/api/getChannelList').then(function(response) {
        return response.data;
    });
    deferred.resolve(data);
    return deferred.promise;
}]);
