/**
 * @author narmiel
 *
 * Загрузка
 */

/**
 * @type {Quest}
 */
Game = null;

/**
 * @type {Player}
 */
GlobalPlayer = null;

/**
 * Files
 */
files = null;

quest = []; // todo

/**
 * 
 */
var mode;

var dirname; // для переменной quest_path

var htmlCode;

var readParagraph = Quest.prototype.readParagraph;
var UrqExec = Quest.prototype.UrqExec;
var UrqEval = Quest.prototype.UrqEval;
var MusicLoop = Quest.prototype.MusicLoop;
var MusicPlay = Quest.prototype.MusicPlay;
var MusicStop = Quest.prototype.MusicStop;
var SoundPlay = Quest.prototype.SoundPlay;
var SoundStop = Quest.prototype.SoundStop;
var SaveGameFile = Quest.prototype.SaveGameFile;

//var srcRead, srcError, srcText;

function utf8_decode(utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i+1);
            c3 = utftext.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return string;
}


/*$(function() {
    $( document ).tooltip();
});*/


$(function() {
    $('#something_wrong').hide();
    $('#infopanel').show();
    
    $('#additionalstyle').find('style').empty();

    /**
     * Загрузить из хеша
     */
    function loadFromHash() {
        $('#loading').show();
        $('#choose-game').hide();

        if (window.location.hash.length > 0) {
            JSZipUtils.getBinaryContent('quests/' + window.location.hash.substr(1) + '.zip', function(err, data) {
                if (err) {
                    name = decodeURIComponent(window.location.hash.substr(1));
                    dirname = 'quests/' + name;
                    $.ajax({
                        url: dirname + '/quest.qst',
                        dataType: "text"
                    }).done(function(msg) {
                        start(msg, window.location.hash.substr(1));
                    }).fail(function () {
                        $.ajax({
                            url: dirname + '/quest.html',
                            type: "HEAD"
                        }).success(function() {
                            startHtml(dirname + '/quest.html', name);
                        }).error(function () {
                            loadFromHashFailed();
                        });
                    });
                    /*quest = [];
                    readQst(dirname + '/quest.qst');
                    start(quest, name);*/
                } else {
                    loadZip(data, window.location.hash.substr(1));
                }
            });
        } else {
            loadFromHashFailed();
        }
    }

    /**
     * Попробуем загрузить квест если в хеше что-то есть
     */
    loadFromHash();

    function loadZip(data, name) {
        var zip = new JSZip(data);

        files = {};
        var qst = [];
        var html = [];

        for (var key in zip.files) {
            if (!zip.files[key].dir) {
                var file = zip.file(key);
                if (file.name.split('.').pop().toLowerCase() == 'qst') {
                    if (file.name.substr(0, 1) == '_' || file.name.indexOf('/_') != -1) {
                        qst.unshift(file);
                    } else {
                        qst.push(file);
                    }
                }
                else if (file.name.split('.').pop().toLowerCase() == 'html' || file.name.split('.').pop().toLowerCase() == 'htm') {
                    html.push(file);
                    readHtml(file);
                }
                else if (file.name.split('.').pop().toLowerCase() == 'css') {
                    $('#additionalstyle').find('style').append(file.asBinary());
                } else if (file.name.split('.').pop().toLowerCase() == 'js') {
                    eval(win2unicode(file.asBinary())); // todo?
                } else {
                    files[file.name.toLowerCase()] = URL.createObjectURL(new Blob([(file.asArrayBuffer())], {type: MIME[file.name.split('.').pop()]}));
                }
            }
        }
        
        if (qst.length > 0) {
            quest = '';

            if (qst[0].name.lastIndexOf('/') != -1) {
                var dir = qst[0].name.substring(0, qst[0].name.lastIndexOf('/') + 1);

                for (var key in files) {
                    var newkey = key.substr(dir.length);
                    files[newkey] = files[key];
                    delete files[key];
                }
            }
            
            for (var i = 0; i < qst.length; i++) {
                quest = quest + '\r\n' + win2unicode(qst[i].asBinary());
            }

            //dirname = dir;
            dirname = '';
            start(quest, name);
        }
        else if (html.length > 0) {
            name = decodeURIComponent(name);
            for (var file in html)
            {
                var start_index = file.name.lastIndexOf('/') + 1;
                var filename = file.name.substring(start_index, file.name.lastIndexOf('.'));
                if (name == filename)
                {
                    openHtml(win2unicode(file.asBinary()), file.name);
                    return;
                }
            }
        }
    }

    /**
     *
     */
    function loadFromHashFailed() {
        $.ajax({
            url: 'games.json',
            dataType: "json"
        }).done(function(quests) {
            for (var i = 0; i < quests.length; i++) {
                $('.gamelist').append(
                    '<a href="#" class="list-group-item gamelink" data-game="' + quests[i].folder + '">' +
                    '<div class="pull-right">' +
                    '<span class="text-muted">' + quests[i].author + '</span>' +
                    '</div>' +
                    '<h4 class="list-group-item-heading">' + quests[i].title + '</h4>' +
                    '<p class="list-group-item-text">' + quests[i].description + '</p>' +
                    '</a>'
                );
            }
        }).fail(function() {
            $('.gamelist').text('Не удалось загрузить список квестов. Скорее всего у вас браузер на основе хромиума (хром, опера, яндекс-браузер и д.р.) и вы запустили веб урку локально. Безопасность хромиума запрещает обращаться к каким бы то не было локальным файлам и считывать их автоматически. Это исправляется если запустить хром с флагом "--allow-file-access-from-files". В вебе такой проблемы ни у кого не будет, речь только о локальной работе. Вы всё ещё можете выбрать файлы игры вручную из папки quests и поиграть.')
        });

        $('#loading').hide();
        $('#choose-game').show();
    }

    /**
     * Выбор игры из списка
     */
    $('.gamelist').on('click', '.gamelink', function() {
        window.location.hash = encodeURIComponent($(this).data('game'));
        loadFromHash();

        return false;
    });

    /**
     * Read file when change file-control
     */
    $('#quest').on('change', function(e) {
        files = {};
        var qst = [];
        var html = [];

        if (e.target.files.length == 1 && e.target.files[0].name.split('.').pop().toLowerCase() == 'zip') {
            var reader = new FileReader();
            var zip = e.target.files[0];

            reader.onload = function() {
                mode = $('#urq_mode').val();
                loadZip(reader.result, zip.name);
            };
            reader.readAsBinaryString(zip, 'CP1251');

            return;
        }

        for (var i = 0; i < e.target.files.length; i++) {
            if (e.target.files[i].name.split('.').pop().toLowerCase() == 'qst')
            {
                qst.push(e.target.files[i]);
            }
            else if (e.target.files[i].name.split('.').pop().toLowerCase() == 'html' || e.target.files[i].name.split('.').pop().toLowerCase() == 'htm')
            {
                html.push(e.target.files[i]);
                readHtml(e.target.files[i]);
            } else if (e.target.files[i].name.toLowerCase() == 'style.css') {
                readStyle(e.target.files[i]);
            } else if (e.target.files[i].name.toLowerCase() == 'script.js') {
                readJs(e.target.files[i]);
            } else {
                readFile(e.target.files[i].name, e.target.files[i]);
            }
        }

        if (qst.length == 0 && html.length == 0) {
            return;
        }

        if (qst.length > 0)
            var name = qst[0].name;
        else if (html.length > 0)
            var name = html[0].name;
        //dirname = name.substr(0, name.toLowerCase().lastIndexOf('.qst'));
        dirname = '';

        mode = $('#urq_mode').val();
        quest = [];
        var slices = qst.length;

        while (qst.length > 0) {
            readQst(qst.shift());
        }

        var loadq = setInterval(function() {
            if (qst.length > 0 && slices == quest.length) {
                clearInterval(loadq);
                start(quest.join('\r\n'), name);
            }
            if (html.length > 0 && htmlCode)
            {
                clearInterval(loadq);
                openHtml(htmlCode, name);
            }
        }, 200); // todo
    });

    /**
     * @param file
     */
    function readQst(file) {
        var reader = new FileReader();
        reader.onload = function() {
            if (file.name.substr(0, 1) == '_') {
                quest.unshift(reader.result);
            } else {
                quest.push(reader.result);
            }
        };

        reader.readAsText(file, 'CP1251');
    }

    /**
     * @param filename
     * @param file
     */
    function readFile(filename, file) {
        var reader = new FileReader();
        reader.onload = function() {
            files[filename] = URL.createObjectURL(new Blob([reader.result], {type: MIME[filename.split('.').pop()]}));
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * @param file
     */
    function readStyle(file) {
        var style = new FileReader();
        style.onload = function() {
            $('#additionalstyle').find('style').append(style.result);
        };

        style.readAsText(file, 'CP1251');
    }

    /**
     * @param file
     */
    function readJs(file) {
        var script = new FileReader();
        script.onload = function() {
            eval(script.result); // todo?
        };

        script.readAsText(file, 'CP1251');
    }

    function readHtml(file) {
        var reader = new FileReader();
        reader.onload = function() {
            htmlCode = reader.result;
        };

        //reader.readAsArrayBuffer(file);
        reader.readAsText(file, 'CP1251');
    }

    /**
     * Запуск
     *
     * @param {String} msg тело квеста
     * @param {String} name имя игры или файла
     */
    function start(msg, name) {
        quest = null;
        window.onbeforeunload = function(e) {
            return 'confirm please';
        };

        $('#loading').hide();
        $('#infopanel').hide();
        $('#logo').hide();

        // Проверка для запуска квеста из списка с альтернативными настройками
        var urq_mode = $('#urq_mode').val();
        if (urq_mode != null && urq_mode != mode)
            mode = urq_mode;

        Game = new Quest(msg);
        Game.name = name;

        Game.init();

        GlobalPlayer = new Player;

        if (mode) GlobalPlayer.setVar('urq_mode', mode);
        if (mode == 'akurq' || mode == 'polyquest')
            GlobalPlayer.setVar('quest_path', dirname);

        GlobalPlayer.Client.crtlInfo = $('#info');
        GlobalPlayer.Client.crtlInput = $('#input');
        GlobalPlayer.Client.crtlButtonField = $('#buttons');
        GlobalPlayer.Client.crtlTextField = $('#textfield');
        GlobalPlayer.Client.crtlInventory = $('#inventory');

        GlobalPlayer.Client.crtlFrameBox = $('#framebox');

        $('#choose-game').hide();
        $('#game').show();

        GlobalPlayer.continue();
    }

    function startHtml(pathname, name) {
        openHtmlFrame(pathname, name);
    }

    function openHtml(text, name) {
        openHtmlFrame('data:text/html;charset=utf-8,' + encodeURI(text), name);
    }

    function openHtmlFrame(text, name) {
        $('#loading').hide();
        $('#infopanel').hide();
        $('#logo').hide();

        $("#textfield").hide();
        $("#buttons").hide();
        $("#input").hide();
        $("#info").hide();
        $('<iframe>', {
            id: 'gameFrame',
            src: text,
            width: "100%",
            height: "100%",
            onload: "this.style.height=this.contentDocument.body.scrollHeight +'px';"
        }).appendTo('#framebox');

        Game = new HtmlQuest(name);
        GlobalPlayer = null;

        $('#choose-game').hide();
        $('#game').show();
    }
});
