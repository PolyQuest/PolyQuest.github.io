/**
 * @author narmiel
 */

/**
 * @constructor
 */
function Parser() {

}

/**
 *
 * @param line
 */
Parser.prototype.parse = function(line) {
    line = line.replace(/^\s+/, '');

    // HTML-расширения
    if (Game.getVar('urq_mode') == 'akurq' || Game.getVar('urq_mode') == 'polyquest')
        if (line.toLowerCase().substring(0, 6) == '<html>' ||
            line.toLowerCase().substring(0, 8) == '<script>' && Game.getVar('urq_mode') == 'polyquest')
        {
            operand = line.toLowerCase().substring(0, line.indexOf('>') + 1);
            return GlobalPlayer.passHTMLCode(this.openTags(line), operand);
        }
    if (Game.getVar('urq_mode') == 'polyquest') {
        if (line.toLowerCase().substring(0, 8) == '<iframe ')
            return GlobalPlayer.createFrame(this.openTags(line));
        var code = line.match(/^<content\s+(frame\s*=\s*(('[^']*')|("[^"]*")))?\s*>/i);
        if (code != null && code.length > 0) {
            if (code.length > 2)
                operand = code [2].substr(1, code [2].length - 2);
            else operand = '';

            line = line.substring(code [0].length, line.lastIndexOf('</content>'));

            return GlobalPlayer.putContent(this.openTags(line), operand);
        }

        var code = line.match(/^<(appendContent|appendScript|appendStyle)\s+((element\s*=\s*(('[^']*')|("[^"]*")))|(elementId\s*=\s*(('[^']*')|("[^"]*"))))\s*>/i);
        if (code != null && code.length > 0) {
            var element, elementId;
            if (code [4] != undefined && code [4].length > 2)
                element = code [4].substr(1, code [4].length - 2);
            else element = '';


            if (code [8] != undefined && code [8].length > 2)
                elementId = code [8].substr(1, code [8].length - 2);
            else elementId = '';


            line = line.substring(code [0].length, line.lastIndexOf('</' + code [1] + '>'));

            if (code [1].toLowerCase() == 'appendContent'.toLowerCase())
                return GlobalPlayer.appendContent(this.openTags(line), element, elementId);
            else if (code [1].toLowerCase() == 'appendScript'.toLowerCase())
                return GlobalPlayer.appendScript(this.openTags(line), element, elementId);
            else if (code [1].toLowerCase() == 'appendStyle'.toLowerCase())
                return GlobalPlayer.appendStyle(this.openTags(line), element, elementId);
        }
    }

    if (Game.getVar('urq_mode') == 'akurq' || Game.getVar('urq_mode') == 'polyquest') {
        // вырезать комментарий
        if (line.indexOf(';') != -1) {
            line = line.substring(0, line.indexOf(';'));
        }
    }

    // просмотреть список известных операторов
    var expl = line.split(' ');
    var operand = expl[0].toLowerCase().trim();
    var command = expl.slice(1).join(' ');

    if (operand == 'if') {
        var cond = line.substring(line.toLowerCase().indexOf('if ') + 3, line.toLowerCase().indexOf(' then '));

        var then;
        var els;
        var ifline = line;

        // todo переделать на обратную польскую
        if (ifline.toLowerCase().indexOf(' if ') != -1) {
            ifline = ifline.substring(0, ifline.toLowerCase().indexOf(' if ') + 1)
        }

        if (ifline.toLowerCase().indexOf(' else ') == -1) {
            then = line.substring(line.toLowerCase().indexOf(' then ') + 6);
            els = false;
        } else {
            then = line.substring(line.toLowerCase().indexOf(' then ') + 6, line.toLowerCase().indexOf(' else '));
            els = line.substring(line.toLowerCase().indexOf(' else ') + 6);
        }

        var conditionResult = new Expression(this.openTags(cond)).calc();

        if (conditionResult === true || conditionResult > 0) {
            this.parse(then);
        } else {
            if (els) {
                this.parse(els);
            }
        }

        return;
    } else if (operand == 'btn') {
        var xbtn = command.split(',');

        if (xbtn.length > 1) {
            var desc = this.prepareLine(xbtn.slice(1).join(',').trim());
            var com = xbtn[0].trim();

            if (com.indexOf('&') == -1) {
                com = this.openTags(com);
            }

            return GlobalPlayer.btn(com, desc);
        }
    }
    else if (operand == 'xbtn') {
        var xbtn = command.split(',');

        if (xbtn.length > 2) {
            var desc = this.prepareLine(xbtn.slice(xbtn.length - 1).join(',').trim());
            var loc = xbtn[0].trim();
            var com = xbtn[1].trim();

            for (var i = 2; i < xbtn.length - 1; i++)
                com = com + '&' + xbtn[i].trim();

            if (loc.indexOf('&') == -1) {
                loc = this.openTags(loc);
                com = com + "&cls &goto " + loc;
            }
            else
                com = loc + '&' + com;


            return GlobalPlayer.btn(com, desc);
        }
    }

    //todo
    line = this.prepareLine(line);
    expl = line.split(' ');
    operand = expl[0].toLowerCase().trim();
    command = expl.slice(1).join(' ');

    if (operand[0] == ':') return;

    switch (operand) {
        case 'save': return Game.save('fast');
        case 'image': return GlobalPlayer.image(command.toString().trim());
        case 'music': return GlobalPlayer.playMusic(command.toString().trim(), false);
        case 'play': return GlobalPlayer.playSound(command.toString().trim());
        case 'clsb': return GlobalPlayer.clsb();
        case 'cls': return GlobalPlayer.cls();
        case 'forget_procs': return GlobalPlayer.forgetProcs();
        case 'proc': return GlobalPlayer.proc(command.toString().trim());
        case 'end': return GlobalPlayer.end();
        case 'anykey': return GlobalPlayer.anykey(command.toString().trim());
        case 'pause': return GlobalPlayer.pause(parseInt(command));
        case 'input': return GlobalPlayer.input(command.toString().trim());
        case 'quit': return GlobalPlayer.quit();
        case 'invkill': return GlobalPlayer.invkill(command.toString().trim().length > 0 ? command.toString().trim() : null);
        case 'perkill': return GlobalPlayer.perkill();
        case 'inv-':
            var item = command.split(',');
            var quantity = 1;
            if (item.length > 1) {
                quantity = parseInt(item[0]);
                item = item[1];
            }

            return GlobalPlayer.invRemove(item.toString().trim(), quantity);
        case 'inv+':
            item = command.split(',');
            quantity = 1;
            if (item.length > 1) {
                quantity = parseInt(item[0]);
                item = item[1];
            }

            return GlobalPlayer.invAdd(item.toString().trim(), quantity);
        case 'goto': return GlobalPlayer.goto(command.toString().trim(), 'goto');
        case 'p':
        case 'print':  return GlobalPlayer.print(this.openLinks(command), false);
        case 'pln':
        case 'println': return GlobalPlayer.print(this.openLinks(command), true);
        case 'btn':
            var btn = command.split(',');

            return GlobalPlayer.btn(btn[0].trim(), btn.slice(1).join(',').trim());
        //рудименты далее
        case 'tokens':
            var reg = new RegExp('[' + ((Game.getVar('tokens_delim') == 'char') ? '' : Game.getVar('tokens_delim')).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + ']', 'gi');

            var str = (new Expression(command.trim())).calc().split(reg);

            GlobalPlayer.setVar('tokens_num', str.length);

            for (var i = 0; i < str.length; i++) {
                GlobalPlayer.setVar('token' + (i + 1), str[i]);
            }

            break;
        case 'instr':
            line = this.openTags2(command);

            if (line.indexOf('=') > 0) {
                GlobalPlayer.setVar(line.substring(0, line.indexOf('=')).trim(), new Expression('\'' + line.substr(line.indexOf('=') + 1) + '\'').calc());
            }

            // no break here
            break;

        // HTML-расширения
        case 'html':
        case 'btn_visible':
        case 'inv_visible':
            GlobalPlayer.setHTMLMode(operand, command.toString().toLowerCase().trim());
            break;

        // Для PolyQuest: доступные изнутри скрипта переменные

        case 'let':
            if (Game.getVar('urq_mode') == 'polyquest') {
                line = this.openTags2(command);

                if (line.indexOf('=') > 0)
                    GlobalPlayer.setPolyVar(line.substring(0, line.indexOf('=')).trim(), new Expression(line.substr(line.indexOf('=') + 1)).calc());
                else
                    GlobalPlayer.setPolyVar(line.trim());

                break;
            }

        // если ничего не помогло^w^w^w не оператор
        default:
            line = this.openTags2(line);
            //  это выражение?
            if (line.indexOf('=') > 0) {
                GlobalPlayer.setVar(line.substring(0, line.indexOf('=')).trim(), new Expression(line.substr(line.indexOf('=') + 1)).calc());
            } else {
                console.log('Unknown operand: ' + operand + ' ignored (line: ' + line + ')');
            }
    }

};

/**
 * Разбиваем по &
 *
 * @param line
 *
 * @returns {String}
 */
Parser.prototype.prepareLine = function (line) {
    var pos = line.replace(/\[\[.+?\]\]/g, function(exp) {
        return exp.replace(/\&/g, ' ');
    }).indexOf('&');

    if (pos != -1) {
        GlobalPlayer.flowAdd(line.substring(pos + 1));
        line = line.substring(0, pos).replace(/^\s+/, '');
    }

    return this.openTags(line);
};

/**
 * Открываем #$, #%$
 *
 * @param {String} line
 *
 * @returns {String}
 */
Parser.prototype.openTags = function (line) {
    line = line.replace(/\#\/\$/g, '<br>');
    line = line.replace(/\#\%\/\$/g, '<br>');
    line = line.replace(/\#\$/g, ' ');
    line = line.replace(/\#\%\$/g, ' ');

    // ##$
    line = line.replace(/\#\#[^\#]+?\$/g, function(exp) {
        return '&#' + exp.substr(2, (exp.length - 3)) + ';';
    });

    while (line.search(/\#[^\#]+?\$/) != -1) {
        line = line.replace(/\#[^\#]+?\$/, function(exp) {
            // рудимент для совместимости
            if (exp[1] == '%') {
                exp = exp.substr(2, (exp.length - 3));
            } else {
                exp = exp.substr(1, (exp.length - 2));
            }
            var result = new Expression(exp).calc();

            return isFloat(result) ? result.toFixed(2) : result;
        });
    }

    return line;
};

Parser.prototype.openTags2 = function (line) {
    line = line.replace('<br>', '\r\n');
    // &#;
    line = line.replace(/&#[^;]+?;/g, function(exp) {
        return String.fromCharCode(parseInt(exp.substr(2, (exp.length - 3))));
    });

    return line;
};

/**
 * @param {String} line
 *
 * @returns {String}
 */
Parser.prototype.openLinks = function(line) {
    while (line.search(/\[\[.+?\]\]/) != -1) {
        line = line.replace(/\[\[.+?\]\]/, function(exp) {
            var text;
            var command;
            exp = exp.substr(2, (exp.length - 4));

            if (exp.indexOf('|') > 0) {
                var exptmp = exp.split('|');
                command = exptmp.slice(1).join('|').trim();
                text = exptmp[0].trim();
            } else {
                command = exp.trim();
                text = exp;
            }

            return GlobalPlayer.Client.convertToLink(text, GlobalPlayer.link(command));
        });
    }

    return line;
};