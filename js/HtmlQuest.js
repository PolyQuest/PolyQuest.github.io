function HtmlQuest(text) {
    this.name = text;
    this.gameFrame = $('#gameFrame');
}

/**
 * сохранение
 *
 * @param {int} slot
 */
HtmlQuest.prototype.save = function(slot) {
    var Datetime = new Date();

    localStorage.setItem(this.name + '_' + slot.toString() + '_name', Datetime.toLocaleDateString() + ' ' + Datetime.toLocaleTimeString());
    localStorage.setItem(this.name + '_' + slot.toString() + '_data', JSON.stringify({
        url: this.gameFrame [0].contentWindow.location.href
    }));
};

/**
 * загрузка
 *
 * @param {int} slot
 */
HtmlQuest.prototype.load = function(slot) {
    var data = JSON.parse(localStorage.getItem(this.name + '_' + slot.toString() + '_data'));
    this.gameFrame.attr('src', data.url);
};