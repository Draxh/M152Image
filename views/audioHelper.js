window.onload{
    document.getElementById('my-audio-player').textTracks[0].addEventListener('cuechange', function() {
        document.getElementById('my-subtitle-display').innerText = this.activeCues[0].text;
    });
}