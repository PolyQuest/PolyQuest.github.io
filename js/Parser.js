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
            return GlobalPlayer.passHTMLCode(line, operand);
        }
    if (Game.getVar('urq_mode') == 'polyquest') {
        if (line.toLowerCase().substring(0, 8) == '<iframe ')
            return GlobalPlayer.createFrame(this.openTags1(line));
        var code = line.match(/^<content\s+(frame\s*=\s*(('[^']*')|("[^"]*")))?\s*>/i);
        if (code != null && code.length > 0) {
            if (code.length > 2)
                operand = code [2].substr(1, code [2].length - 2);
            else operand = '';

            line = line.substring(code [0].length, line.lastIndexOf('</content>'));

            return GlobalPlayer.putContent(this.openTags1(line), operand);
        }

        var code = line.match(/^<(appendContent|appendScript|appendStyle)\s+((element\s*=\s*(('[^']*')|("[^"]*")))|(elementId\s*=\s*(('[^']*')|("[^"]*"))))(\s+src\s*=\s*(('[^']*')|("[^"]*")))?>/i);
        if (code != null && code.length > 0) {
            var element, elementId, src;
            if (code [4] != undefined && code [4].length > 2)
                element = code [4].substr(1, code [4].length - 2);
            else element = '';


            if (code [8] != undefined && code [8].length > 2)
                elementId = code [8].substr(1, code [8].length - 2);
            else elementId = '';

            if (code [12] != undefined && code [12].length > 2)
                src = code [12].substr(1, code [12].length - 2);
            else src = null;


            line = line.substring(code [0].length, line.lastIndexOf('</' + code [1] + '>'));
            var str;

            var appendFunc;
            if (code [1].toLowerCase() == 'appendContent'.toLowerCase()) {
                appendFunc = GlobalPlayer.appendContent;
                line = this.openTags1(line);
            }
            else if (code [1].toLowerCase() == 'appendScript'.toLowerCase()) {
                appendFunc = GlobalPlayer.appendScript;
                line = this.openTags2(line);
            }
            else if (code [1].toLowerCase() == 'appendStyle'.toLowerCase()) {
                appendFunc = GlobalPlayer.appendStyle;
                line = this.openTags2(line);
            }

            if (src) {
                //str = GlobalPlayer.readSrcFile(src);
                str = GlobalPlayer.waitReadingSrcFile(appendFunc, src, element, elementId);

                /*if (appendFunc == GlobalPlayer.appendScript)
                eval(str);*/
            }
            else
                str = appendFunc(line, element, elementId);

            return str;
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

        var conditionResult = new Expression(this.openTags2(cond)).calc();

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
                com = this.openTags1(com);
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
                loc = this.openTags2(loc);
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
        case 'image': return GlobalPlayer.image(this.openTags2(command).toString().trim());
        case 'music': return GlobalPlayer.playMusic(this.openTags2(command).toString().trim(), false);
        case 'play': return GlobalPlayer.playSound(this.openTags2(command).toString().trim());
        case 'clsb': return GlobalPlayer.clsb();
        case 'cls': return GlobalPlayer.cls();
        case 'forget_procs': return GlobalPlayer.forgetProcs();
        case 'proc': return GlobalPlayer.proc(this.openTags2(command).toString().trim());
        case 'end': return GlobalPlayer.end();
        case 'anykey': return GlobalPlayer.anykey(this.openTags2(command).toString().trim());
        case 'pause': return GlobalPlayer.pause(parseInt(this.openTags2(command)));
        case 'input': return GlobalPlayer.input(this.openTags2(command).toString().trim());
        case 'quit': return GlobalPlayer.quit();
        case 'invkill':
            command = this.openTags2(command).toString().trim();
            return GlobalPlayer.invkill(command.length > 0 ? command : null);
        case 'perkill': return GlobalPlayer.perkill();
        case 'inv-':
            var item = this.openTags2(command).split(',');
            var quantity = 1;
            if (item.length > 1) {
                quantity = parseInt(item[0]);
                item = item[1];
            }

            return GlobalPlayer.invRemove(item.toString().trim(), quantity);
        case 'inv+':
            item = this.openTags2(command).split(',');
            quantity = 1;
            if (item.length > 1) {
                quantity = parseInt(item[0]);
                item = item[1];
            }

            return GlobalPlayer.invAdd(item.toString().trim(), quantity);
        case 'goto': return GlobalPlayer.goto(this.openTags2(command).toString().trim(), 'goto');
        case 'p':
        case 'print':  return GlobalPlayer.print(this.openLinks(this.openTags1(command)), false);
        case 'pln':
        case 'println': return GlobalPlayer.print(this.openLinks(this.openTags1(command)), true);
        case 'btn':
            var btn = this.openTags2(command).split(',');

            return GlobalPlayer.btn(btn[0].trim(), btn.slice(1).join(',').trim());
        //рудименты далее
        case 'tokens':
            var reg = new RegExp('[' + ((Game.getVar('tokens_delim') == 'char') ? '' : Game.getVar('tokens_delim')).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + ']', 'gi');

            var str = (new Expression(this.openTags2(command).trim())).calc().split(reg);

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
Parser.prototype.openTags = function (line, code) {
    if (code != undefined) {
        if (!code) {
            line = line.replace(/\\x00\\r\\n/g, '<br>');
            line = line.replace(/\\x00\\r\\n/g, '<br>');
        }
        else {
            line = line.replace(/\\x00\\r\\n/g, '\r\n');
            line = line.replace(/\\x00\\r\\n/g, '\r\n');
        }
    }
    else {
        line = line.replace(/\#\/\$/g, '\x00\r\n');
        line = line.replace(/\#\%\/\$/g, '\x00\r\n');
    }


    line = line.replace(/\#\$/g, ' ');
    line = line.replace(/\#\%\$/g, ' ');

    if (code != undefined) {
        line = line.replace(/\#\#[^\#]+?\$/g, function (exp) {
            if (!code)
                return '&#' + exp.substr(2, (exp.length - 3)) + ';';
            else
                return String.fromCharCode(parseInt(exp.substr(2, (exp.length - 3))));
        });
    }

    /*if (code)
        line = line.replace(/&#[^;]+?;/g, function(exp) {
            return String.fromCharCode(parseInt(exp.substr(2, (exp.length - 3))));
        });*/


    if (code != undefined)
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

    /*line = line.replace(/((?:[^\#])|^)\#[^\#]+?\$/, function(exp) {
            if (exp[0] != '#')
                exp = exp.substr(1);
        }*/
};

Parser.prototype.openTags1 = function (line) {
    return this.openTags(line, false);
};

Parser.prototype.openTags2 = function (line) {
    return this.openTags(line, true);
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