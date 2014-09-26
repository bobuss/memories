/*
* SC68 Web player interface
*
* 2014 Bertrand Tornil
*
* Lots of parts from
* See Juergen Wothke works on https://github.com/wothke/sc68-2.2.1
*
* And the port to CODEF : http://namwollem.blogspot.co.uk/
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.le
*/

(function($) {
  $( document ).ready(function() {
    var songs = [
      'musics/Virtual_Escape_Theme.sndh',
      'musics/Virtual_Escape_Enhanced.sndh',
      'musics/EQX2.sndh',
      'musics/HMD1.sndh',
      'musics/HMD2.sndh',
      'musics/HMD3.sndh'
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
          self.updateTrackInfos();
        }.bind(this);
        xhr.send(null);
      },
      togglePause: function() {
        player.isPaused = !player.isPaused;
        if (player.isPaused) {
          $(".action-pause span").attr("class", "glyphicon glyphicon-pause");
        } else {
          $(".action-pause span").attr("class", "glyphicon glyphicon-play");
        }
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
      },
      updateTrackInfos: function() {
        $(".desc").html(
          '<h3>' + player.title + '</h3>' +
          '<p>by ' + player.author + '</p>');
      }
    };


    document.onkeydown = KeyCheck;

    function KeyCheck(ev){
      if (!ev) {
        var ev=window.event;
      }
      var KeyID = ev.keyCode;

      switch(KeyID) {
        // space key : pause toggle
        case 32:
          audio.togglePause();
          ev.preventDefault();
          return false;
          break;
        // up key : play previous song
        case 38:
          audio.playPreviousSong();
          ev.preventDefault();
          return false;
          break;
        // up key : play next song
        case 40:
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
      audio.togglePause();
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