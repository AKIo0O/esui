/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 弹出框
 * @author dbear
 */

define(
    function (require) {
        require('./Button');
        require('./Panel');
        // css
        require('css!./css/Button.css');
        require('css!./css/Dialog.css');

        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        var maskIdPrefix = 'ctrlMask';

        /**
         * 弹出框控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Dialog(options) {
            Control.apply(this, arguments);
        }

        /**
         * 渲染控件前重绘控件
         * 
         */
        function parseMain(options) {
            var main = options.main;
            // 如果main未定义，则不作解析
            if (!main) {
                return;
            }
            var els = main.getElementsByTagName('*');
            var len = els.length;
            var roleName;
            var content;
            var roles = {};

            while (len--) {
                roleName = els[len].getAttribute('data-role');
                if (roleName) {
                    content = els[len].innerHTML;
                    // 不再校验，如果设置了相同的data-role，
                    // 直接覆盖
                    roles[roleName] = content;
                }
            }

            options.title = roles.title || options.title;
            options.content = roles.content || options.content;

            if (options.needFoot === true) {
                if (roles.foot) {
                    options.foot = roles.foot;
                }
            }
            else if (options.needFoot === false) {
                options.foot = null;
            }

        }


        /**
         * 构建对话框标题栏
         * 
         * @inner
         */
        function getHeadHtml(control) {
            var me = control;
            var head = 'head';
            var title = 'title';
            var close = 'close-icon';

            var closeTpl = 
                '<div class="${clsClass}" id="${clsId}">&nbsp;</div>';
            var closeIcon = '';

            if (me.closeButton) {
                closeIcon = lib.format(
                    closeTpl,
                    {
                        'clsId': helper.getId(me, close),
                        'clsClass': helper.getPartClasses(me, close).join(' ')
                    }
                );
            }

            var headTpl = ''
                + '<div id="${headId}" class="${headClass}">'
                +   '<div id="${titleId}" class="${titleClass}">'
                +   '${title}'
                +   '</div>'
                +   '${closeIcon}'
                + '</div>';

            var headData = {
                'headId':  helper.getId(me, head),
                'headClass':  helper.getPartClasses(me, head).join(' '),
                'titleId':  helper.getId(me, title),
                'titleClass':  helper.getPartClasses(me, title).join(' '),
                'title': me.title,
                'closeIcon': closeIcon
            };

            var headHtml = lib.format(headTpl, headData);

            var headPanelHtml = ''
                + '<div data-ui="type:Panel;childName:head">'
                + headHtml
                + '</div>';

            return headPanelHtml;

        }

        /**
         * 构建对话框主内容和底部内容
         *
         * @param {string} type foot | body 
         * @inner
         */
        function getBFHtml(control, type) {
            var tpl = ''
                + '<div class="${panelClass}" '
                + 'data-ui="type:Panel;childName:${childName}">'
                + '</div>';

            var data = {
                'panelClass':
                    helper.getPartClasses(control, type + '-panel').join(' '),
                'childName': type
            };

            return lib.format(tpl, data);

        }

        /**
         * 获取指定部分dom元素
         *
         * @param {string} type foot | body | head
         * @inner
         */
        function getPartHtml(type) {
            var domId = lib.getId(this, type);
            return lib.g(domId);
        }

        /**
         * 点击头部关闭按钮时事件处理函数
         *
         * @inner
         */
        function closeClickHandler() {
            this.hide();
        }

        /**
         * 页面resize时事件的处理函数
         *
         * @param {ui.Dialog} 控件对象
         * @inner
         */
        function resizeHandler(control) {
            var me = control;
            var page = lib.page;
            var main = me.main;
            var left = me.left;
            var top = me.top;
            if (!left) {
                left = (page.getViewWidth() - main.offsetWidth) / 2;
            }

            if (left < 0) {
                left = 0;
            }


            if (!top) {
                top = 100;
            }

            main.style.left = left + 'px';
            main.style.top = page.getScrollTop() + top + 'px';
        }

        /**
         * 页面大小发生变化的事件处理器
         *
         * @param {ui.Dialog} 控件对象
         * @inner
         */
        function maskResizeHandler(control) {
            repaintMask(getMask(control));
        }

        /**
         * 遮盖层初始化
         * 
         * @param {string} maskId 遮盖层domId
         * @inner
         */
        function initMask(maskId) {
            var el = document.createElement('div');
            el.id = maskId;
            document.body.appendChild(el);
        }


        /**
         * 重新绘制遮盖层的位置
         *
         * @inner
         * @param {HTMLElement} mask 遮盖层元素.
         */
        function repaintMask(mask) {
            var width = Math.max(
                            document.documentElement.clientWidth,
                            Math.max(
                                document.body.scrollWidth,
                                document.documentElement.scrollWidth)),
                height = document.documentElement.clientHeight;

            mask.style.width = width + 'px';
            mask.style.height = height + 'px';
        }

        /**
         * 获取遮盖层dom元素
         *
         * @param {ui.Dialog} 控件对象
         * @inner
         * @return {HTMLElement} 获取到的Mask元素节点.
         */
        function getMask(control) {
            var dialogId = helper.getId(control);
            var id = maskIdPrefix + '-' + dialogId;
            var mask = lib.g(id);

            if (!mask) {
                initMask(id);
            }

            return lib.g(id);
        }


        Dialog.OK_TEXT = '确定';
        Dialog.CANCEL_TEXT = '取消';


        /**
         * 自增函数
         *
         * @inner
         */
        Dialog.increment = (function () {
            var i = 0;
            return function () {
                return i++;
            };
        }());

        Dialog.prototype = {
            /**
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Dialog',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                //由main解析
                parseMain(options);
                /**
                 * 默认Dialog选项配置
                 */
                var properties = {
                    autoPosition: false,  // 是否自动定位居中
                    closeButton: true,    // 是否具有关闭按钮
                    draggable: false,     // 是否可拖拽
                    mask: true,           // 是否具有遮挡层
                    width: 600,           // 对话框的宽度
                    height: 175,            // 对话框的高度
                    top: 100,             // 对话框的垂直位置
                    left: 0,              // 对话框的水平位置
                    title: '我是标题',    // 标题的显示文字
                    content: '<p>我是内容</p>',   // 内容区域的显示内容
                    foot: ''
                        + '<div data-ui="type:Button;id:btnFootOk;'
                        + 'childName:btnOk;'
                        + 'skin:spring;height:26;width:50;">确定</div>'
                        + '<div data-ui="type:Button;'
                        + 'id:btnFootCancel;childName:btnCancel;'
                        + 'height:26;">取消</div>',
                    needFoot: true
                };
                lib.extend(properties, options);
                lib.extend(this, properties);
            },

            /**
             * 初始化DOM结构，仅在第一次渲染时调用
             */
            initStructure: function () {
                var main = this.main;

                // 设置样式
                main.style.left = '-10000px';
                main.innerHTML = ''
                    + getHeadHtml(this)
                    + getBFHtml(this, 'body')
                    + getBFHtml(this, 'foot');
                this.initChildren(main);

                // 初始化控件主元素上的行为
                if (this.closeButton !== false) {
                    var close = lib.g(helper.getId(this, 'close-icon'));
                    helper.addDOMEvent(this, close, 'click', closeClickHandler);
                }
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: helper.createRepaint(
                {
                    name: 'height',
                    paint: function (dialog, value) {
                        dialog.main.style.height = value + 'px';
                        if (dialog.isShow) {
                            resizeHandler(dialog);
                        }
                    }
                },
                {
                    name: 'width',
                    paint: function (dialog, value) {
                        dialog.main.style.width = value + 'px';
                        if (dialog.isShow) {
                            resizeHandler(dialog);
                        }
                    }
                },
                {
                    name: 'title',
                    paint: function (dialog, value) {
                        var titleId = helper.getId(dialog, 'title');
                        lib.g(titleId).innerHTML = value;
                    }
                },
                {
                    name: 'content',
                    paint: function (dialog, value) {
                        var bfTpl = ''
                            + '<div class="${class}" id="${id}">'
                            + '${content}'
                            + '</div>';
                        // 获取body panel
                        var body = dialog.getBody();
                        var bodyId = helper.getId(dialog, 'body');
                        var bodyClass = helper.getPartClasses(dialog, 'body');
                        var data = {
                            'class': bodyClass.join(' '),
                            'id': bodyId,
                            'content': value 
                        };
                        body.setContent(
                            lib.format(bfTpl, data)
                        );
                    }
                },
                {
                    name: 'foot',
                    paint: function (calendar, value) { 
                        var bfTpl = ''
                            + '<div class="${class}" id="${id}">'
                            + '${content}'
                            + '</div>';
                        var footId = helper.getId(calendar, 'foot');
                        var footClass = helper.getPartClasses(calendar, 'foot');
                        // 取消了foot
                        if (value == null) {
                            calendar.needFoot = false;
                            var foot = calendar.getFoot();
                            calendar.removeChild(foot);
                        }
                        else {
                            calendar.needFoot = true;
                            var foot = calendar.getFoot();
                            var data = {
                                'class': footClass.join(' '),
                                'id': footId,
                                'content': value 
                            };
                            foot.setContent(
                                lib.format(bfTpl, data)
                            );
                        }
                    }
                }
            ),

            /**
             * 获取对话框主体的控件对象
             * 
             * 
             * @return {HTMLElement} 
             */
            getBody: function () {
                return this.getChild('body');
            },

            /**
             * 获取对话框主体的dom元素
             * 
             * 
             * @return {HTMLElement} 
             */
            getBodyDOM: function () {
                return getPartHtml(this, 'head');
            },

            /**
             * 获取对话框头部的控件对象
             * 
             * 
             * @return {HTMLElement} 
             */
            getHead: function () {
                return this.getChild('head');
            },

            /**
             * 获取对话框头部的dom元素
             * 
             * 
             * @return {HTMLElement} 
             */
            getHeadDOM: function () {
                return getPartHtml(this, 'head');
            },

            /**
             * 获取对话框腿部的控件对象
             * 
             * 
             * @return {HTMLElement} 
             */
            getFoot: function () {
                return this.getChild('foot');
            },

            /**
             * 获取对话框腿部的dom元素
             * 
             * 
             * @return {HTMLElement} 
             */
            getFootDOM: function () {
                return getPartHtml(this, 'foot');
            },

            /**
             * 显示对话框
             * 
             */
            show: function () {
                var mask = this.mask;
                if (helper.isInStage(this, 'INITED')) {
                    this.render();
                }

                // 浮动层自动定位功能初始化
                if (this.autoPosition) {
                    lib.on(window, 'resize', resizeHandler);
                }
                this.setWidth(this.width);
                resizeHandler(this);

                // 拖拽功能初始化
                if (this.draggable) {
                    // TODO: 拖拽的库函数还未实现
                    // baidu.dom.draggable(main, {handler:this.getHead()});
                }

                if (mask) {
                    this.showMask();
                }

                this.fire('show');
                this.isShow = true;

            },

            /**
             * 显示遮盖层
             * 
             */
            showMask: function () {
                var mask = getMask(this);
                var clazz = [];
                var maskClass = helper.getPartClasses(this, 'mask').join(' ');

                clazz.push(maskClass);
                repaintMask(mask);

                mask.className = clazz.join(' ');
                mask.style.display = 'block';
                this.curMaskListener = lib.curry(maskResizeHandler, this);
                lib.on(window, 'resize', this.curMaskListener);            
            },

            /**
             * 隐藏对话框
             * 
             */
            hide: function () {
                if (this.isShow) {
                    if (this.autoPosition) {
                        lib.un(window, 'resize', resizeHandler);
                    }
                    var main = this.main;
                    var mask = this.mask;

                    main.style.left = main.style.top = '-10000px';

                    if (mask) {
                        this.hideMask();
                    }
                }

                this.fire('hide');
                this.isShow = false;
            },

            /**
             * 隐藏遮盖层
             */
            hideMask: function () {
                var mask = getMask(this);
                if ('undefined' != typeof mask) {
                    lib.removeNode(mask);
                    lib.un(window, 'resize', this.curMaskListener); 
                    this.curMaskListener = null;
                }
            },

            /**
             * 设置标题文字
             * 
             * @param {string} html 要设置的文字，支持html
             */
            setTitle: function (html) {
                this.setProperties({'title': html});
            },

            /**
             * 设置内容
             *
             * @param {string} content 要设置的内容，支持html.
             */
            setContent: function (content) {
                this.setProperties({'content': content});
            },

            /**
             * 设置腿部内容
             *
             * @param {string} foot 要设置的内容，支持html.
             */
            setFoot: function (foot) {
                this.setProperties({'foot': foot});
            },

            /**
             * 设置对话框的高度，单位为px
             *
             * @param {number} height 对话框的高度.
             */
            setHeight: function (height) {
                this.setProperties({'height': height});
            },

            /**
             * 设置对话框的宽度，单位为px
             *
             * @param {number} width 对话框的宽度.
             */
            setWidth: function (width) {
                this.setProperties({'width': width});
            }
        };


        /**
         * 确认提示框
         *
         */
        Dialog.confirm = function (args) {
            var dialogPrefix    = 'DialogConfirm';
            var ui = require('./main');

            /**
             * 获取按钮点击的处理函数
             * 
             * @private
             * @param {Function} eventHandler 用户定义的按钮点击函数
             * @return {Functioin}
             */
            function getBtnClickHandler(eventHandler, id) {
                return function () {
                    var dialog = ui.get(dialogPrefix + id);
                    var domId = helper.getId(dialog);
                    var isFunc = (typeof eventHandler == 'function');

                    if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                        dialog.hide();
                        dialog.dispose();
                        //移除dom
                        lib.removeNode(domId);
                    }
                
                    dialog = null;
                };
            }

            var index = Dialog.increment();

            var title = args.title || '';
            var content = args.content || '';
            var type = args.type || 'confirm';
            var onok = args.onok;
            var oncancel = args.oncancel;
            var width   = args.width || 300; 
            var tpl = [
                '<div class="ui-dialog-icon ui-dialog-icon-${type}"></div>',
                '<div class="ui-dialog-text">${content}</div>'
            ].join('');


            //创建main
            var main = document.createElement('div');
            document.body.appendChild(main);
            var dialog = ui.create(
                'Dialog', 
                {
                    id: dialogPrefix + index,
                    closeButton: false,
                    title: '',
                    width: width,
                    mask: true,
                    main: main
                }
            );

            dialog.setTitle(title);
            dialog.setContent(
                lib.format(tpl, { type: type, content: content })
            );
            dialog.show();
            //使用默认foot，改变显示文字
            var okBtn = dialog.getFoot().getChild('btnOk');
            var cancelBtn = dialog.getFoot().getChild('btnCancel');
            okBtn.setContent(Dialog.OK_TEXT);
            cancelBtn.setContent(Dialog.CANCEL_TEXT);
            okBtn.on(
                'click',
                getBtnClickHandler(onok, index)
            );
            cancelBtn.on(
                'click',
                getBtnClickHandler(oncancel, index)
            );

        };


        Dialog.alert = function (args) {
            var dialogPrefix = 'DialogAlert';
            var okPrefix = 'DialogAlertOk';

            var ui = require('./main');

            /**
             * 获取按钮点击的处理函数
             * 
             * @private
             * @param {Function} eventHandler 用户定义的按钮点击函数
             * @return {Functioin}
             */
            function getBtnClickHandler(eventHandler, id) {
                return function () {
                    var dialog = ui.get(dialogPrefix + id);
                    var okBtn = ui.get(okPrefix + id);
                    var domId = helper.getId(dialog);

                    var isFunc = (typeof eventHandler == 'function');

                    if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                        dialog.hide();
                        okBtn.dispose();
                        dialog.dispose();
                        //移除dom
                        lib.removeNode(domId);
                    }
                
                    dialog = null;
                };
            }

            var index = Dialog.increment();

            var title = args.title || '';
            var content = args.content || '';
            var type = args.type || 'warning';
            var onok = args.onok;
            var width   = args.width || 300; 
            var tpl = [
                '<div class="ui-dialog-icon ui-dialog-icon-${type}"></div>',
                '<div class="ui-dialog-text">${content}</div>'
            ].join('');


            //创建main
            var main = document.createElement('div');
            document.body.appendChild(main);
            var dialog = ui.create(
                'Dialog', 
                {
                    id: dialogPrefix + index,
                    closeButton: false,
                    title: '',
                    width: width,
                    mask: true,
                    main: main
                }
            );

            dialog.setTitle(title);
            dialog.setContent(
                lib.format(tpl, { type: type, content: content })
            );

            dialog.setFoot(''
                + '<div data-ui="type:Button;childName:okBtn;id:' 
                + okPrefix + index + '; skin:spring;width:50;">'
                + Dialog.OK_TEXT
                + '</div>'
            );
            
            dialog.show();
            var okBtn = dialog.getFoot().getChild('okBtn');
            okBtn.on(
                'click',
                getBtnClickHandler(onok, index)
            );
        }; 

        require('./lib').inherits(Dialog, Control);
        require('./main').register(Dialog);

        return Dialog;
    }
);
