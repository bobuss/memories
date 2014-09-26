(function($) {
  $( document ).ready(function() {
    var songs = [
      'musics/EQX1.sndh',
      'musics/EQX2.sndh',
      'musics/HMD1.sndh',
      'musics/HMD2.sndh',
      'musics/HMD3.sndh',
      'musics/Virtual_Escape_Theme.sndh',
    ];


    var sampleRate;

    try {
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      sampleRate = (new AudioContext().sampleRate) * 1.0;
    } catch(e) {
      alert('Web Audio API is not supported in this browser (get Chrome 18 or Firefox 26)');
    }

    var whichtrack = 1;
    var defaultSongTimeout= 15*60*1000;



    function doOnLoad() {
      audio.initialAudioSetup();
      audio.createPlaylistDisplay();
      audio.startMusicPlayback();
    }

    function doOnEnd() {
      audio.playNextSong();
      player.setPauseMode(false);
    }

    function doOnTrackChange() {
      player.setPauseMode(false);
    }

    function doOnLoop() {
      // triggered when switching from one track to the next (within the same song file)
    }

    function doOnError() {
      doOnEnd();
    }

    var player= new Sc68Player(
      sampleRate,
      defaultSongTimeout,
      doOnLoad,
      doOnEnd,
      doOnTrackChange,
      doOnLoop,
      doOnError
    );

    Audio = function(songs) {
      this.audioCtx;
      this.bufferSource;
      this.gainNode;
      this.analyzerNode;

      this.current = -1;
      this.someSongs = songs;
      this.createPlaylistDisplay();
    };

    Audio.prototype = {
      initialAudioSetup: function() {
        if (typeof this.bufferSource != 'undefined') {
          this.bufferSource.stop(0);
        } else {
          this.setupAudioNodes();
        }
      },
      setupAudioNodes: function() {
        if (typeof this.audioCtx == 'undefined') {
          try {
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            this.audioCtx = new AudioContext();
          } catch(e) {
            alert('Web Audio API is not supported in this browser (get Chrome 18 or Firefox 26)');
          }
          this.analyzerNode = this.audioCtx.createAnalyser();
          var scriptNode = player.createScriptProcessor(this.audioCtx);
          this.gainNode = this.audioCtx.createGain();

          scriptNode.connect(this.gainNode);
          this.gainNode.connect(this.analyzerNode);
          this.analyzerNode.connect(this.audioCtx.destination);
        }
      },
      playNextSong: function() {
        this.current= (++this.current >=this.someSongs.length) ? 0 : this.current;
        var someSong= this.someSongs[this.current];
        this.playSong(someSong);
      },
      playPreviousSong: function() {
        this.current= (--this.current<0) ? this.current+this.someSongs.length : this.current;
        var someSong= this.someSongs[this.current];
        this.playSong(someSong);
      },
      playSong: function(someSong) {
        var self = this;
        var arr= someSong.split(";");
        if (arr.length >1) someSong= arr[0];

        var track= arr.length>1?parseInt(arr[1]):0;

        var xhr = new XMLHttpRequest();
        xhr.open("GET", someSong, true);
        xhr.responseType = "arraybuffer";

        xhr.onload = function (oEvent) {
          player.loadData(xhr.response, track, defaultSongTimeout);
          self.updatePlaylistDisplay();
        }.bind(this);
        xhr.send(null);
      },
      startMusicPlayback: function() {
        player.setPauseMode(false);

        if (typeof this.bufferSource === 'undefined') {
          this.bufferSource = this.audioCtx.createBufferSource();
          if (!this.bufferSource.start) {
            this.bufferSource.start = this.bufferSource.noteOn;
            this.bufferSource.stop = this.bufferSource.noteOff;
          }
          this.bufferSource.start(0);
        }
      },
      createPlaylistDisplay: function() {
        var list = '';
        this.someSongs.forEach(function(song, i){
          list += '<a data-track="' + i + '" class="list-group-item song">' + song + '</a>\n';
        });

        $(".songs-list").html(list);

        $(".song").click(function(){
          audio.current = $(this).attr('data-track') - 1;
          audio.playNextSong();
        });

      },
      updatePlaylistDisplay: function() {
        var self = this;
        $(".song").each(function(i, song){
          if (i == self.current) {
            $(song).addClass("active");
          } else {
            $(song).removeClass("active")
          }
        });
      }
    };


    document.onkeydown = KeyCheck;

    function KeyCheck(ev){
      if (!ev) var ev=window.event;
      var KeyID = ev.keyCode;

      switch(KeyID){
        // key 1
        case 49:
          whichtrack=-1;
          audio.current=whichtrack;
          audio.playNextSong();

          ev.preventDefault();
                return false;
          break;
        // key 2
        case 50:
          whichtrack=0;
          audio.current=whichtrack;
          audio.playNextSong();
          ev.preventDefault();
                return false;
          break;
        // key 3
        case 51:
          whichtrack=1;
          audio.current=whichtrack;
          audio.playNextSong();
          ev.preventDefault();
                return false;
          break;
        // key 4
        case 52:
          whichtrack=2;
          audio.current=whichtrack;
          audio.playNextSong();
          ev.preventDefault();
                return false;
          break;
        // key 5
        case 53:
          whichtrack=3;
          audio.current=whichtrack;
          audio.playNextSong();
          ev.preventDefault();
                return false;
          break;
        // key 6
        case 54:
          whichtrack=4;
          audio.current=whichtrack;
          audio.playNextSong();
          ev.preventDefault();
                return false;
          break;
      }
    }

    $(".action-stop").click(function(){
      player.setPauseMode(true);
    });

    $(".action-pause").click(function(){
      player.isPaused = !player.isPaused;
    })

    $(".action-forward").click(function(){
      audio.playNextSong();
    });

    $(".action-backward").click(function(){
      audio.playPreviousSong();
    });

    var audio = new Audio(songs);
    audio.playNextSong();

  });
})(jQuery);