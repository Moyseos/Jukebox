/* globals $,  SC */

/**
*Jukebox Singleton
*/

var Jukebox = {
	"songs": [],
	"activeSong": null,
	"volume": 100,
	"isPlaying": false,
	"dom": {},

// Run this function to kick the whole thing off
	"start": function() {
// Init the SoundCloud API
		SC.initialize({ client_id: "fd4e76fc67798bfa742089ed619084a6" });

		this.dom = {
			"play": $(".jukebox-controls-play"),
			"stop": $(".jukebox-controls-stop"),
			"next": $(".jukebox-controls-next"),
			"prev": $(".jukebox-controls-previous"),
			"mute": $(".jukebox-controls-mute"),
			"upload": $(".jukebox-header-upload input"),
			"songs": $(".jukebox-songs"),

			"scUpload": $(".jukebox-header-soundcloud-upload"),
		};

		this.addSong("./songs/CoastalBrake.mp3", {
			title: "Costal Brake",
			artist:" Tycho",
		});
		this.addSong("./songs/11 My Way - Live.m4a", {
			title: "My way! ",
			artist: " Il Volo",
		});
		this.addSong("./songs/15 Cielito Lindo - Live.m4a", {
			title: "Cielito Lindo ",
			artist: " Il Volo",
		});
		this.addSong("https://soundcloud.com/viceroymusic/50-cent-disco-inferno-viceroy-jet-life-remix");
		this.change(this.songs[0]);

		this.render();
		this.listen();
	},

	"listen": function() {
		this.dom.play.on("click", function() {
			if (this.isPlaying) {
				this.pause();
			}
			else {
				this.play();
			}
		}.bind(this));

		this.dom.mute.on("click", function() {
			this.setVolume(0);
		}.bind(this));

		this.dom.next.on("click", function() {
			this.skip(1);
		}.bind(this));

		this.dom.prev.on("click", function() {
			this.skip(-1);
		}.bind(this));

		this.dom.stop.on("click", this.stop.bind(this));

		this.dom.scUpload.on("input", function() {
			this.addSong(this.dom.scUpload.val());
			console.log(this);
		}.bind(this));

		this.dom.upload.on("change", function() {
			var files = this.dom.upload.prop("files");
			console.log(files);

			for (var i = 0; i < files.length; i++) {
				var file = URL.createObjectURL(files[i]);
				this.addSong(file, {
					title: "Uploaded song",
					artist: "Unknown",
				});
			}
		}.bind(this));
	},


	render: function() {
	// render song elements
		for (var i = 0; i < this.songs.length; i++) {
			var $song = this.songs[i].render();

			if (this.songs[i] === this.activeSong) {
				$song.addClass("isActive");
			}
			else {
				$song.removeClass("isActive");
			}
		}

// Indicate paused va played
		this.dom.play.toggleClass("isPlaying", this.isPlaying);
		this.dom.stop.toggleClass("isDisabled", !this.isPlaying);
	},

	"play": function(song) {
		if (song) {
			this.change(song);
		}

		if (!this.activeSong) {
			return null;
		}


		this.isPlaying = true;
		this.activeSong.play();
		this.render();
		return this.activeSong;
	},

	"pause": function() {
		if (!this.activeSong) {
			return null;
		}

		this.isPlaying = false;
		this.activeSong.pause();
		this.render();
		return this.activeSong;
	},

	"stop": function() {
		if (!this.activeSong) {
			return false;
		}
		this.activeSong.stop();
		this.isPlaying = false;
		this.render();
		return this.activeSong;
	},

	"change": function(song) {
		if (this.activeSong) {
			this.activeSong.stop();
		}

		this.activeSong = song;
		this.render();
		return this.activeSong;
	},

	"skip": function(direction) {
		if (!this.activeSong) {
			return false;
		}

		var idx = this.songs.indexOf(this.activeSong);

		var desiredIndex = (idx + direction) % this.songs.length;

		return this.change(this.songs[desiredIndex]);
	},

	"shuffle": function() {
		console.log("Jukebox is shuffling");
	},



	"addSong": function(file, meta) {
		var song;

		if (file.indexOf("soundcloud.com") !== -1) {
			song = new SoundCloudSong(file);
		}
		else {
			song = new FileSong(file, meta);
		}

		this.songs.push(song);

		var $song = song.render();
		this.dom.songs.append($song);
		this.render();

		return song;
	},

// volumeLevel should be a number between 0-100 (%)
	"setVolume": function(volumeLevel) {
		this.volume = volumeLevel;
	},
};

/**
* Song class
*/
class Song {
	constructor() {
		this.file = null;
		this.meta = {};
		this.audio = null;
		this.$song = $('<div class="jukebox-songs-song"></div>');
	}

	render() {
		this.$song.html("");
		this.$song.append('<div class="jukebox-songs-song-pic"></div>');
		this.$song.append('<div class="jukebox-songs-song-title">' + this.meta.title + '</div>');
		this.$song.append('<div class="jukebox-songs-song-artist">' + '<a href= ' + this.meta.user + '>' + this.meta.artist + '</div>');
		this.$song.append('<img class="soundcloud-song-image" src = ' + this.meta.image + '>');
		this.$song.append('<div class="jukebox-songs-song-duration">' + "3:33" + '</div>');
		this.$song.data("song", this);

		return this.$song;
	}

	play() {
		this.audio.play();
	}

	pause() {
		this.audio.pause();
	}

	stop() {
		this.audio.pause();
		this.audio.currentTime = 0;
	}
}

/**
* FileSong class
*/
class FileSong extends Song {

	constructor(file, meta) {
		super();
		this.file = file;
		this.meta = meta || {
			title: "Unknown title",
			artist: "Unknown artist",
		};
		this.audio = new Audio(file);
	}
}
/**
 * SoundCloudSong Class
 */
class SoundCloudSong extends Song {

	constructor(url) {
		super();

		SC.resolve(url)

		.then(function(song) {
			this.meta = {
				title: song.title,
				artist: song.user.username,
				image: song.artwork_url,
				user: song.permalink_url,
				duration: song.duration,
			};
			return song;
		}.bind(this))

		.then(function(song) {
			var uri = song.uri + "/stream?client_id=fd4e76fc67798bfa742089ed619084a6";
			this.audio = new Audio(uri);
		}.bind(this))

		.then(function() {
			this.render();
		}.bind(this));
	}
}



$(document).ready(function() {
	Jukebox.start();
});
