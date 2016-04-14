/**
 * @author narmiel
 */


/**
 * @param {string} text тело игры
 *
 * @constructor
 */
function Quest(text) {

    /**
     * @type {string} имя игры или файла для сохранения
     */
    this.name = '';

    /**
     * @type {boolean}
     */
    this.locked = false;

    /**
     * @type {Object}
     */
    this.labels = {};

    /**
     * @type {Object}
     */
    this.useLabels = {};

    /**
     * @type {Object}
     */
    this.items = {};

    /**
     * @type {Object}
     */
    this.vars = {};

    /**
     * @type {number}
     */
    this.position = 0;

    /**
     * @type {string}
     */
    this.realCurrentLoc = '';

    /**
     * @type {string}
     */
    this.quest = text.replace(/^[\n\r]+|[\n\r]+$/g,'').replace(/\/\*[\s\S.]+?\*\//g,'').split(/[\n\r]+/);

    // HTML-расширения
    this.HTMLMode = false;
    this.btn_visible = true;
    this.inv_visible = true;

    this.polyvars = {};
    this.frames = {};

    if (this.quest.length > 0 && this.quest[0].match(/\s*polymorph\s*true\s*/i)) {
        mode = 'polyquest';
        this.quest.shift();
    }
}


/**
 * @param {String} label
 */
Quest.prototype.getLabel = function(label) {
    label = label.toString().toLowerCase();

    if (this.labels[label] != undefined) {
        return {
            name: label,
            pos: this.labels[label]
        };
    } else {
        return false;
    }
};

/**
 * следующая строка
 */
Quest.prototype.next = function() {
    var line = this.get(this.position);

    this.position++;

    if (!line) {
        return false;
    }

    //if (this.getVar('urq_mode') != null && this.getVar('urq_mode') != 'urqw') { // ripurq, dosurq, akurq
    if (this.getVar('urq_mode') == 'ripurq' || this.getVar('urq_mode') == 'dosurq') {
        // вырезать комментарий
        if (line.indexOf(';') != -1) {
            line = line.substring(0, line.indexOf(';'));
        }
    }

    return line.replace(/\t/g, ' ');
};

/**
 * строка по номеру
 */
Quest.prototype.get = function(i) {
    if (this.quest[i] != undefined) {
        return this.quest[i];
    } else  {
        return false;
    }
};

/**
 * инициализация
 */
Quest.prototype.init = function() {
    this.labels = {};
    this.useLabels = {};
    this.items = {};
    this.vars = {
        'tokens_delim': '\ \,\"\?\!'
    };
    this.position = 0;
    this.realCurrentLoc = '';

    /**
     * Собираем метки
     */
    for (var i = this.quest.length -1; i >=0; i--) {
        var str = this.get(i);

        if (str.substr(0, 1) == '_' && str.substr(1, 1) != '_') {
            this.quest[i - 1] = this.quest[i - 1] + str.substr(1);
            this.quest[i] = '';
        } else if (str.substr(0, 1) == ':') {
            if (str.substr(0, 5).toLowerCase() == ':use_') {
                this.useLabels[str.substr(1).toLowerCase().trim()] = i;
            }

            this.labels[str.substr(1).toLowerCase().trim()] = i;
        }

        // HTML-расширения
        else if (!Game.gameRestarted && (mode == 'akurq' || mode == 'polyquest')) {
            var tag = str.match(/((<\/html>)|(<\/script>)|(<\/iframe>)|(<\/content>)|(<\/appendContent>)|(<\/appendScript>)|(<\/appendStyle>))\s*(;.*?)?$/g);
            if (tag == null || tag.length == 0)
                continue;

            tag = tag [0].substring(2, tag [0].indexOf('>'));
            var opentag;
            if (tag == 'html' || tag == 'script')
                opentag = new RegExp('<' + tag + '>', 'i');
            else
                opentag = new RegExp('<' + tag + '(\\s+[^>]+)*>', 'i');

            if (str.indexOf(';') != -1 && tag == 'html')
                this.quest[i] = str.substring(0, str.indexOf(';'));

            var lastpos = i;

            i--;
            while (i >= 0) {
                str = this.get(i);
                if (str.indexOf(';') != -1 && tag == 'html')
                    str = str.substring(0, str.indexOf(';'));

                this.quest[lastpos] = str + "\r\n" + this.quest[lastpos];
                this.quest[i] = '';

                if (str.trim().search(opentag) == 0)
                    break;

                i--;
            }
        }
    }

    for (var i = 0; i < this.quest.length; i++) {
        if (this.quest[i].substr(0, 1) == ':') {
            var key = this.quest[i].substr(1).toLowerCase().trim();
            this.realCurrentLoc = key;
            this.setVar('current_loc', key);
            this.setVar('previous_loc', key);

            break;
        }
    }

    if (Game.gameRestarted && (mode == 'akurq' || mode == 'polyquest')) {
        location.reload(true);
        //window.location.href = window.location.pathname + window.location.search;

        Game.gameRestarted = false;
        GlobalPlayer.setVar('urq_mode', mode);
        GlobalPlayer.setVar('quest_path', dirname);
    }

};

/**
 * @param name
 * @param {int} count
 */
Quest.prototype.addItem = function(name, count) {
    return this.setItem(name, this.getItem(name) + parseInt(count));
};

/**
 * @param name
 * @param {int} count
 */
Quest.prototype.removeItem = function(name, count) {
    return this.setItem(name, this.getItem(name) - parseInt(count));
};

/**
 *
 * @param name
 * @param {int} count
 */
Quest.prototype.setItem = function (name, count) {
    if (Game.locked) return false;

    count = parseInt(count);

    if (count <= 0) {
        delete this.items[name];
        this.setVar(name, 0);
    } else {
        this.items[name] = count;
        this.setVar(name, count);
    }
};

/**
 *
 * @param name
 * @return {int}
 */
Quest.prototype.getItem = function (name) {
    return (this.items[name] == undefined) ? 0 : this.items[name];
};

/**
 * @param {String} variable
 * @param {*} value
 */
Quest.prototype.setVar = function(variable, value) {
    if (variable.substr(0, 4).toLowerCase() == 'inv_') {
        variable = variable.substr(4);

        this.setItem(variable, value);
    } else {
        this.vars[variable.toLowerCase()] = value;

        for (var key in Game.polyvars)
            if (key.toLowerCase() == variable.toLowerCase()) {
                GlobalPlayer.putVariableToScript(key)
                break;
            }
    }
};

/**
 * @param variable
 * @returns {*}
 */
Quest.prototype.getVar = function(variable) {
    variable = variable.toLowerCase();

    if (variable.substr(0, 4) == 'inv_') {
        variable = variable.substr(4);
    }

    if (variable == 'rnd') {
        return Math.random();
    } else if (variable.substr(0, 3) == 'rnd') {
        return Math.floor(Math.random() * parseInt(variable.substr(3))) + 1;
    }

    // Для выражений вроде "1 деньги"
    if (variable.split(' ').length > 1) {
        var count = variable.split(' ')[0];
        if (!isNaN(count)) {
            variable = variable.split(' ').slice(1).join(' ').trim()
            return this.vars[variable] >= count;
        }
    }

    if (this.vars[variable] != undefined) {
        return this.vars[variable];
    }

    return 0;
};

/**
 * сохранение
 *
 * @param {int} slot
 */
Quest.prototype.save = function(slot) {
    var Datetime = new Date();

    localStorage.setItem(this.name + '_' + slot.toString() + '_name', Datetime.toLocaleDateString() + ' ' + Datetime.toLocaleTimeString());
    localStorage.setItem(this.name + '_' + slot.toString() + '_data', JSON.stringify({
        items: this.items,
        vars: this.vars,
        polyvars: this.polyvars,
        position: this.position,
        realCurrentLoc: this.realCurrentLoc
    }));
};

/**
 * загрузка
 *
 * @param {int} slot
 */
Quest.prototype.load = function(slot) {
    var data = JSON.parse(localStorage.getItem(this.name + '_' + slot.toString() + '_data'));
    this.items = data.items;
    this.vars = data.vars;
    this.polyvars = data.polyvars;
    this.position = data.position;
    this.realCurrentLoc = data.realCurrentLoc;
};

// JS-расширения: встроенные функции JavaScript для взаимодействия с URQL
Quest.prototype.readParagraph = function(loc) {
    GlobalPlayer.goto(loc, 'goto');
    GlobalPlayer.continue();

    /*GlobalPlayer.play('goto ' + loc + '&end');
    GlobalPlayer.fin();*/
}

Quest.prototype.UrqExec = function(code) {
    GlobalPlayer.Parser.parse(code);
}

Quest.prototype.UrqEval = function(code) {
    var Result = new Expression(GlobalPlayer.Parser.openTags(code)).calc();
    return Result;
}

Quest.prototype.MusicLoop = function() {
    GlobalPlayer.playMusic(Game.getVar('music'), true);
}

Quest.prototype.MusicPlay = function(srcFile) {
    if (srcFile)
        GlobalPlayer.playMusic(srcFile);
    else {
        if (gameMusic.paused)
            gameMusic.play();
        if (GlobalPlayer.musicStop)
            GlobalPlayer.musicStop = false;
    }
}

Quest.prototype.MusicStop = function() {
    GlobalPlayer.musicStop = true;
    if (!gameMusic.paused)
        gameMusic.pause();
}

Quest.prototype.SoundPlay = function(srcFile) {
    GlobalPlayer.playSound(srcFile);
}

Quest.prototype.SoundStop = function() {
    //GlobalPlayer.soundStop = true;
    if (!gameSound.paused)
        gameSound.pause();
    if (gameMusic.paused)
        gameMusic.play();
}

Quest.prototype.SaveGameFile = function(slot) {
    GlobalPlayer.save(slot);
}

Quest.prototype.visitSystemLocation = function(loc) {
    var curLoc = Game.realCurrentLoc;
    GlobalPlayer.goto(loc, 'return');
    GlobalPlayer.continue();
    Game.realCurrentLoc = curLoc;
}
