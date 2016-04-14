/**
 * @author narmiel
 */

var PLAYER_STATUS_NEXT = 0;
var PLAYER_STATUS_END = 1;
var PLAYER_STATUS_ANYKEY = 2;
var PLAYER_STATUS_PAUSE = 3;
var PLAYER_STATUS_INPUT = 4;
var PLAYER_STATUS_QUIT = 5;

var gameMusic = new Audio();
var gameSound = new Audio();

/**
 * @constructor
 */
function Player() {
    this.Parser = new Parser();
    this.Client = new Client();

    this.text = [];
    this.buttons = [];
    this.links = [];
    this.inf = false;

    this.procPosition = [];

    this.flow = 0;
    this.flowStack = [];
    this.flowStack[this.flow] = [];

    /**
     * @type {boolean}
     */
    this.lock = false;

    /**
     * системные команды
     */

    this.musicStop = false;
    this.musicLoop = false;
    this.soundStop = false;
    this.gameRestarted = false;
}


/**
 *
 */
Player.prototype.continue = function() {
    this.play();

    this.fin();
};

/**
 * рендер
 */
Player.prototype.fin = function() {
    if (Game.getVar('music')) this.playMusic(Game.getVar('music'), true);


    if (this.status != PLAYER_STATUS_NEXT) {
        this.Client.render({
            status: this.status,
            text: this.text,
            buttons: this.buttons
        });
    }

    this.lock = !(this.status == PLAYER_STATUS_END || this.status == PLAYER_STATUS_PAUSE);


    if (this.musicLoop)
    {
        this.musicLoop = false;
        Game.visitSystemLocation('endmusicloop');
    }
};

/**
 *
 */
Player.prototype.play = function(line) {
    this.lock = true;

    this.status = PLAYER_STATUS_NEXT;

    if (Game.getVar('urq_mode') == 'polyquest')
        this.getVariablesFromScript();

    if (line !== undefined) {
        this.Parser.parse(line);
    }

    while ((this.status == PLAYER_STATUS_NEXT)) {
        if (this.flowStack[this.flow].length == 0 && ((line = Game.next()) !== false)) {
            this.Parser.parse(line);
        }

        while (this.flowStack[this.flow].length > 0 && this.status == PLAYER_STATUS_NEXT) {
            this.Parser.parse(this.flowStack[this.flow].pop());
        }
    }
};

/**
 * добавление команды в текущий поток
 *
 * @param {String} line
 */
Player.prototype.flowAdd = function(line) {
    this.flowStack[this.flow].push(line);
};

/**
 * команды далее исполняются юзером по ходу игры
 */

/**
 * коммон
 */
Player.prototype.common = function() {
    var commonLabel = 'common';

    if (Game.getVar('urq_mode') != 'ripurq' && Game.getVar('common') !== 0) {
        commonLabel = commonLabel + '_' + Game.getVar('common');
    }

    if (this.proc(commonLabel)) {
        this.forgetProcs();
        this.play();
    }
};

/**
 * @param {int} actionId
 * @param {bool} link
 */
Player.prototype.action = function(actionId, link) {
    if (this.lock) return false;

    if (link) {
        var command = this.links[actionId];
        this.links[actionId] = null;
    } else {
        for (var key in this.buttons) {
            if (this.buttons[key].id == actionId) {
                command = this.buttons[key].command;
                delete this.buttons[key];

                break
            }
        }
    }

    if (command === null) return;

    var label = Game.getLabel(command);

    if (label) {
        this.btnAction(label.name);
    } else {
        this.xbtnAction(command);
    }
};

/**
 * @param {String} labelName
 * @returns {boolean}
 */
Player.prototype.btnAction = function(labelName) {
    this.cls();

    this.common();

    if (this.goto(labelName, 'btn')) {
        this.continue();
    }
};

/**
 * @param {String} command
 * @returns {boolean}
 */
Player.prototype.xbtnAction = function(command) {
    this.common();

    this.play(command + '&end');
    this.fin();
};

/**
 * @param {String} labelName
 * @returns {boolean}
 */
Player.prototype.useAction = function(labelName) {
    if (this.lock) return false;

    this.play('proc ' + labelName + '&end');
    this.fin();
};

/**
 * @param {String} keycode
 * @returns {boolean}
 */
Player.prototype.anykeyAction = function(keycode) {
    if (this.inf.length > 0) {
        this.setVar(this.inf, keycode);
    }

    GlobalPlayer.continue();
};

/**
 * @param {String} value
 * @returns {boolean}
 */
Player.prototype.inputAction = function(value) {
    this.setVar(this.inf, value);

    this.continue();
};

/**
 * @inheritDoc
 */
Player.prototype.setVar = function(variable, value) {
    if (Game.locked) return false;

    variable = variable.trim();

    if (variable.toLowerCase() === 'style_dos_textcolor') {
        Game.setVar('style_textcolor', dosColorToHex(value));
    } else
    if (variable.toLowerCase() === 'urq_mode') {
        if (value == 'dosurq') {
            Game.setVar('style_backcolor', '#000');
            Game.setVar('style_textcolor', '#FFF');
        }
    } else

    // todo переместить
    if (variable.toLowerCase() === 'image') {
        var file = value;
        if (files != null) {
            if (files[value] !== undefined) {
                file = value;
            } else if (files[value + '.png'] !== undefined) {
                file = value + '.png';
            } else if (files[value + '.jpg'] !== undefined) {
                file = value + '.jpg';
            } else if (files[value + '.gif'] !== undefined) {
                file = value + '.gif';
            }
        }

        this.image(file);
    }

    Game.setVar(variable, value);
};

/**
 * HTML-расширения
 */
Player.prototype.setHTMLMode = function(setting, value) {
    value = (value === 'true');

    if (setting == 'html')
        Game.HTMLMode = value;
    else if (setting == 'btn_visible')
        Game.btn_visible = value;
    else if (setting == 'inv_visible')
        Game.inv_visible = value;
}

Player.prototype.setPolyVar = function(variable, value) {

    variable = variable.trim();

    if (value != undefined) {
        this.setVar(variable, value);
        GlobalPlayer.putVariableToScript(variable);
    }
    //Game.setVar(variable, value);

    /*if (variable.substr(0, 4).toLowerCase() == 'inv_')
        variable = variable.substr(4);*/

    Game.polyvars [variable] = Game.getVar(variable);
};


/**
 * @param {String} src
 */
    // todo переместить в клиента
Player.prototype.image = function(src) {
    if (src) {
        if (src [0] == '=')
            src = src.substr(1).trim();
        var result;
        if ((result = src.match(/("[^"]*")|('[^']*')/)) && result.length > 0)
            src = src.substr(1, src.length - 2);

        this.print($('<img alt="Изображение" style="margin: 5px auto; display: block;">').attr('src', src).prop('outerHTML'), true);
    }
};

/**
 * @param {String} src
 * @param {Boolean} loop
 */
Player.prototype.playMusic = function(src, loop) {
    var file;

    //Если предполагалась подстановка #quest_path$;
    if (src && src.length != 0 && src [0] == '/')
        src = src.substr(1);

    if (files === null)
    {
        if (dirname == "")
            file = 'quests/' + Game.name + '/' + src;
        else
            file = src;
    } else {
        file = files[src];
    }

    if (src) {
        if (gameMusic.getAttribute('src') != file) {
            gameMusic.src = file;

            if (loop || Game.getVar('urq_mode') == 'polyquest') {
                gameMusic.addEventListener('ended', function() {
                    if (loop) {
                        gameMusic.src = file;
                        gameMusic.play();
                    }
                    else {
                        //this.musicLoop = true;
                        Game.visitSystemLocation('endmusicloop');
                    }
                }, false);
            }

            gameMusic.play();
            if (GlobalPlayer.musicStop)
                GlobalPlayer.musicStop = false;
        }
    } else {
        gameMusic.pause();
    }
};

Player.prototype.playSound = function(src) {
    if (volume == 3) return;

    //var Sound;
    if (!gameSound.paused)
        gameSound.pause();

    src = src.toString().trim();
    if (files === null) {
        if (dirname == "")
            gameSound = new Audio('quests/' + Game.name + '/' + src);
        else
            gameSound = new Audio(src);
    }
    else {
        gameSound = new Audio(files[src]);
    }

    gameSound.volume = (volume == 1) ? 1 : 0.5;
    if (!gameMusic.paused)
        gameMusic.pause();
    gameSound.play();
    if (gameMusic.paused)
        gameSound.addEventListener('ended', function() {
            if (!GlobalPlayer.musicStop)
                gameMusic.play();
        }, false);
};
