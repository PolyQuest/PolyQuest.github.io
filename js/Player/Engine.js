/**
 * команды из квеста
 *
 * @author narmiel
 */

/**
 * прыгнуть на метку
 *
 * @param {string} labelName
 * @param {string} type
 */
Player.prototype.goto = function(labelName, type) {
    var label = Game.getLabel(labelName);

    if (label) {
        if (type != 'proc') {
            Game.realCurrentLoc = label.name;
        }

        // todo контанты 
        if ((type == 'btn' || (Game.getVar('urq_mode') != 'doqurq' && type == 'goto'))) { //****!!!**** 'dosurq'
            Game.setVar('previous_loc', Game.getVar('current_loc'));
            Game.setVar('current_loc', labelName);
        }

        if (type == 'goto') {
            if (Game.getVar('urq_mode') == 'ripurq') {
//                this.buttons = [];
//                this.text = [];
            }
        }

        if (type == 'btn' || type == 'goto' || type == 'proc') {
            if (Game.getVar('urq_mode') == 'ripurq') {
                Game.setVar(label.name, Game.getVar(label.name) + 1);
            } else {
                Game.setVar('count_' + label.name, Game.getVar('count_' + label.name) + 1);
            }
        }

        Game.position = label.pos;

        // весь стек что дальше очищается
        this.flowStack[this.flow] = []; 

        return true;
    }

    return false;
};

/**
 * удаление переменных
 */
Player.prototype.perkill = function() {
    var urqMode = Game.getVar('urq_mode');
    
    Game.vars = {};
    this.setVar('urq_mode', urqMode);

    $.each(Game.items, function(index, value) {
        Game.setVar(index, parseInt(value));
    });
};

/**
 * cls
 */
Player.prototype.cls = function() {
    this.text = [];
    this.buttons = [];
    this.links = [];

    this.Client.cls();
};

/**
 * cls
 */
Player.prototype.clsb = function() {
    this.buttons = [];
    this.links = [];
    
    for(var i = 0; i < this.text.length; i++) {
        this.text[i][0] = this.text[i][0].replace(/\<a.+?\>.+?\<\/a\>/gi, function (match) {
            return GlobalPlayer.Client.disableLink(match);
        });
    }

    this.Client.clsb();
};

/**
 * удаление предметов
 *
 * @param {String} item
 */
Player.prototype.invkill = function(item) {
    if (item != null) {
        Game.setItem(item, 0);
    } else {
        $.each(Game.items, function(index, value) {
            Game.setItem(index, 0);
        });
    }
};

/**
 * прок
 *
 * @param {String} label
 */
Player.prototype.proc = function(label) {
    this.flow++;
    this.procPosition.push(Game.position);

    if (this.goto(label, 'proc')) {
        this.flowStack[this.flow] = [];
        return true;
    } else {
        this.flow--;
        this.procPosition.pop();
        return false;
    }
};

/**
 * end
 */
Player.prototype.end = function() {
    if (this.procPosition.length > 0) {
        this.flowStack[this.flow].pop();
        Game.position = this.procPosition.pop();
        this.flow--;
    } else {
        this.flowStack[this.flow] = [];
        this.status = PLAYER_STATUS_END;
    }
};

/**
 *
 */
Player.prototype.forgetProcs = function() {
    this.flowStack[0] = this.flowStack[this.flow];
    this.procPosition = [];
    this.flow = 0;
};

/**
 * @param {String} inf
 */
Player.prototype.anykey = function(inf) {
    if (Game.locked) return false;

    this.inf = inf;
    this.status = PLAYER_STATUS_ANYKEY;
};

/**
 * @param {int} inf
 */
Player.prototype.pause = function(inf) {
    if (Game.locked) return false;

    this.inf = inf;
    this.status = PLAYER_STATUS_PAUSE;
};

/**
 * @param {String} inf
 */
Player.prototype.input = function(inf) {
    if (Game.locked) return false;

    this.inf = inf;
    this.status = PLAYER_STATUS_INPUT;
};

/**
 *
 */
Player.prototype.quit = function() {
    this.status = PLAYER_STATUS_QUIT;
};

/**
 * @param {String} item
 * @param {int} quantity
 */
Player.prototype.invRemove = function(item, quantity) {
    Game.removeItem(item, quantity);
};

/**
 * @param {String} item
 * @param {int} quantity
 */
Player.prototype.invAdd = function(item, quantity) {
    Game.addItem(item, quantity);
};

/**
 * @param {String} text
 * @param {bool} br
 */
Player.prototype.print = function(text, br) {
    var textColor = null;
    if (isNaN(Game.getVar('style_textcolor'))) {
        textColor = Game.getVar('style_textcolor');
    } else if (Game.getVar('style_textcolor') > 0) {
        var red = (Game.getVar('style_textcolor') >> 16) & 0xFF;
        var green = (Game.getVar('style_textcolor') >> 8) & 0xFF;
        var blue = Game.getVar('style_textcolor') & 0xFF;
        
        textColor = 'rgb(' + blue + ', ' + green  + ', ' + red + ')';
    }
    
    this.text.push([text, br,  textColor]);
};

/**
 * @param {String} command
 * @param {String} desc
 */
Player.prototype.btn = function(command, desc) {
    var id = this.buttons.length;

    this.buttons.push({
        id: id,
        command: command,
        desc: desc 
    });
};

/**
 * @param {String} command
 */
Player.prototype.link = function(command) {
    var id = this.links.length;

    this.links[id] = command;
    
    return id;
};

// HTML-расширения
Player.prototype.passHTMLCode = function(text, tag) {

    /*var str = tag + '[^(<\/' + tag.substr(1) + ')]*<\/' + tag.substr(1);
    var code = text.match(new RegExp(str));
    if (code == null || code.length < 2)
        return;

    code = code [1];*/
    // после добавления разделителей строки проверка по маске не работает

    var endtag = '<\/' + tag.substr(1);
    var pos = text.lastIndexOf(endtag);
    if (pos == -1 || pos < text.length - endtag.length)
        return;

    var code = text.substring(tag.length, pos);

    if (tag == '<html>' && Game.HTMLMode)
        this.passHTML(GlobalPlayer.Parser.openTags1(code));
    else if (tag == '<script>')
        this.executeScript(GlobalPlayer.Parser.openTags2(code));
}



Player.prototype.passHTML = function(code) {

    //<a href="btn:...">

    code = GlobalPlayer.Parser.openLinks(code);

    var index = 0;
    while ((index = code.search(/<a href=["']?btn:/, index)) != -1) {
        var limit = '"';
        var index1 = index + code.substr(index).indexOf('=');
        do
            index1++;
        while (code [index1] == ' ');
        if (code [index1] == limit || code [index1] == "'") {
            if (code [index1] != limit)
                limit = "'";
            index1++;
        }
        else limit = '>';

        var ref = '';
        while (code [index1] != limit)
        {
            ref += code [index1];
            index1++;
        }

        while (code [index1] != '>') index1++;

        var index0 = index1 + 1;
        index1 = code.indexOf('</a>', index0);
        text = code.substr(index0, index1 - index0);
        index1 += 4;

        code = code.substr(0, index) +
            GlobalPlayer.Client.convertToLink(text, GlobalPlayer.link(ref.substr(4))) +
               code.substr(index1);
        index = index1;

        /*code = code.replace(/<a href="(.*?)">(.*?)<\/a>/, function(str, ref, text, offset, s) {
            if (ref.toLowerCase().substring(0, 4) == 'btn:')
                return GlobalPlayer.Client.convertToLink(text, GlobalPlayer.link(ref.substr(4)));

            return str;
        });*/
    }

    this.printHTML(code);
}

Player.prototype.printHTML = function(text) {
    this.text = [];
    this.text.push([text, false,  null]);
};

Player.prototype.executeScript = function(code) {
    window.eval(code);
    this.getVariablesFromScript();
}

Player.prototype.putVariableToScript = function(variable) {
    var result;
    //if (/[A-Za-z_\$]+[A-Za-z0-9_\$]*/.test(key))
    if ((result = variable.match(/[A-Za-z_\$]+[A-Za-z0-9_\$]*/)) && result.length != 0 && result[0].length == variable.length)
        window [variable] = Game.getVar(variable.toLowerCase());
    else
        if (result.length != 0)
        {
            if (window [result[0]] == undefined)
                window.eval(result[0] + " = [];");
            window.eval(variable + "=" + Game.getVar(variable.toLowerCase()) + ";");
        }
}

Player.prototype.getVariablesFromScript = function() {
    var result;
    for (var key in Game.polyvars)
        if ((result = key.match(/[A-Za-z_\$]+[A-Za-z0-9_\$]*/)) && result.length != 0 && result[0].length == key.length)
            Game.setVar(key.toLowerCase(), window [key]);
        else
            Game.setVar(key.toLowerCase(), window.eval(key));
}

Player.prototype.createFrame = function(code) {
    var doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = code;
    var frame = doc.getElementsByTagName('iframe');
    if (frame == null || frame.length == 0)
        return;

    var newframe = document.createElement('iframe');
    newframe.name = frame [0].name;
    newframe.width = frame [0].width;
    newframe.height = frame [0].height;
    newframe.src = "about:blank";

    GlobalPlayer.Client.crtlFrameBox.append(newframe);


    Game.frames [frame [0].name] = newframe;
    window [frame [0].name] = newframe;
}

Player.prototype.putContent = function(text, operand) {
    var frame;
    if (operand != '' && operand != undefined)
        frame = Game.frames [operand];
    else
        frame = Game.frames [Object.keys (Game.frames) [0]];

    if (frame == null || frame == undefined)
        return;


    frame.contentWindow.document.open();
    frame.contentWindow.document.write(text);
    frame.contentWindow.document.close();

    GlobalPlayer.Client.crtlFrameBox.show();
}

function create(htmlStr) {
    var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    return frag;
}

Player.prototype.readSrcFile = function(src)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', src, false);
    xhr.send();
    return xhr.responseText;

    /*return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'text';
        xhr.onload = function() {
            resolve(this.responseText);
        };
        xhr.onerror = reject;
        xhr.send();
    });*/

    /*var fileReader = new FileReader();
     fileReader.onload = function() {
     Player.prototype.appendScript(fileReader.result, element, elementId);
     };
     fileReader.onerror = function() {
     return;
     }

     fileReader.readAsText(src, 'CP1251');*/

    /*$.ajax({
     url: src,
     dataType: "text"
     }).done(function(msg) {
     Player.prototype.appendScript(msg, element, elementId);
     }).fail(function () {
     return;
     });*/
}

Player.prototype.appendContent = function(text, element, elementId) {

    if (element.toLowerCase() == 'head')
        document.head.innerHTML = document.head.innerHTML + text;
    else if (element.toLowerCase() == 'body') {
        document.body.innerHTML = document.body.innerHTML + text;
        //document.location.reload(false);
        var htmlCode = document.documentElement.innerHTML;
        /*document.open("text/html", "replace");
        document.write(htmlCode);  // htmlCode is the variable you called newDocument
        document.close();*/

        //$('<script>alert("hi");</' + 'script>').appendTo(document.body);
    }
    else
    {
        element = document.getElementById(elementId);
        //element.insertAdjacentHTML('afterEnd', text);
        element.insertAdjacentHTML('beforeEnd', text);
    }
}

Player.prototype.appendScript = function(text, element, elementId) {

    var script = document.createElement("script");
    script.innerHTML = text;

    if (element.toLowerCase() == 'head')
        document.head.appendChild(script);
    else if (element.toLowerCase() == 'body')
        document.body.appendChild(script);
    else {
        element = document.getElementById(elementId);
        element.appendChild(script);
    }
}

Player.prototype.appendStyle = function(text, element, elementId, src) {

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = text;

    if (element.toLowerCase() == 'head')
        document.head.appendChild(css);
    else if (element.toLowerCase() == 'body')
        document.body.appendChild(css);
    else
    {
        element = document.getElementById(elementId);
        element.appendChild(css);
    }
}