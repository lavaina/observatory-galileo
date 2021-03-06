// Generated by CoffeeScript 1.6.3
(function() {
  var Observatory, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof require !== "undefined" && require !== null) {
    _ = require('underscore');
  }

  Observatory = Observatory != null ? Observatory : {};

  _.extend(Observatory, {
    LOGLEVEL: {
      SILENT: -1,
      FATAL: 0,
      ERROR: 1,
      WARNING: 2,
      INFO: 3,
      VERBOSE: 4,
      DEBUG: 5,
      MAX: 6,
      NAMES: ["FATAL", "ERROR", "WARNING", "INFO", "VERBOSE", "DEBUG", "MAX"]
    },
    settings: {
      maxSeverity: 3,
      printToConsole: true
    },
    initialize: function(s) {
      var _ref;
      this._loggers = [];
      if (s != null) {
        this.settings.maxSeverity = s.logLevel != null ? this.LOGLEVEL[s.logLevel] : 3;
        this.settings.printToConsole = (_ref = s.printToConsole) != null ? _ref : true;
      }
      this._consoleLogger = new Observatory.ConsoleLogger('default');
      this.subscribeLogger(this._consoleLogger);
      return this._defaultEmitter = new Observatory.GenericEmitter('default');
    },
    getDefaultLogger: function() {
      return this._defaultEmitter;
    },
    isServer: function() {
      return !(typeof window !== "undefined" && window.document);
    },
    formatters: {
      basicFormatter: function(options) {
        return {
          timestamp: new Date,
          severity: options.severity,
          textMessage: options.message,
          module: options.module,
          object: options.obj,
          isServer: Observatory.isServer()
        };
      }
    },
    viewFormatters: {
      _convertDate: function(timestamp) {
        return timestamp.getUTCDate() + '/' + (timestamp.getUTCMonth() + 1) + '/' + timestamp.getUTCFullYear();
      },
      _convertTime: function(timestamp, ms) {
        var ts;
        if (ms == null) {
          ms = true;
        }
        ts = timestamp.getUTCHours() + ':' + timestamp.getUTCMinutes() + ':' + timestamp.getUTCSeconds();
        if (ms) {
          ts += '.' + timestamp.getUTCMilliseconds();
        }
        return ts;
      },
      _ps: function(s) {
        return '[' + s + ']';
      },
      basicConsole: function(o) {
        var full_message, t, ts;
        t = Observatory.viewFormatters;
        ts = t._ps(t._convertDate(o.timestamp)) + t._ps(t._convertTime(o.timestamp));
        full_message = ts + (o.isServer ? "[SERVER]" : "[CLIENT]");
        full_message += o.module ? t._ps(o.module) : "[]";
        full_message += t._ps(Observatory.LOGLEVEL.NAMES[o.severity]);
        full_message += " " + o.textMessage;
        if (o.object != null) {
          full_message += " | " + (JSON.stringify(o.object));
        }
        return full_message;
      }
    },
    _loggers: [],
    getLoggers: function() {
      return this._loggers;
    },
    subscribeLogger: function(logger) {
      return this._loggers.push(logger);
    },
    unsubscribeLogger: function(logger) {
      return this._loggers = _.without(this._loggers, logger);
    }
  });

  Observatory.MessageEmitter = (function() {
    var _loggers;

    _loggers = [];

    MessageEmitter.prototype._getLoggers = function() {
      return this._loggers;
    };

    function MessageEmitter(name) {
      this.name = name;
      this._loggers = [];
    }

    MessageEmitter.prototype.subscribeLogger = function(logger) {
      return this._loggers.push(logger);
    };

    MessageEmitter.prototype.unsubscribeLogger = function(logger) {
      return this._loggers = _.without(this._loggers, logger);
    };

    MessageEmitter.prototype.emitMessage = function(message) {
      var l, _i, _j, _len, _len1, _ref, _ref1;
      _ref = Observatory.getLoggers();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        l = _ref[_i];
        l.addMessage(message);
      }
      if (this._loggers.length > 0) {
        _ref1 = this._loggers;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          l = _ref1[_j];
          l.addMessage(message);
        }
      }
      return message;
    };

    return MessageEmitter;

  })();

  Observatory.Logger = (function() {
    var messageBuffer;

    messageBuffer = [];

    function Logger(name, formatter, useBuffer, interval) {
      this.name = name;
      this.formatter = formatter != null ? formatter : Observatory.viewFormatters.basicConsole;
      this.useBuffer = useBuffer != null ? useBuffer : false;
      this.interval = interval != null ? interval : 3000;
      if (typeof formatter === 'boolean') {
        this.interval = this.useBuffer;
        this.useBuffer = this.formatter;
        this.formatter = Observatory.viewFormatters.basicConsole;
      }
      this.messageBuffer = [];
    }

    Logger.prototype.messageAcceptable = function(m) {
      return (m != null) && (m.timestamp != null) && (m.severity != null) && (m.isServer != null) && ((m.textMessage != null) || (m.htmlMessage != null));
    };

    Logger.prototype.addMessage = function(message) {
      if (!this.messageAcceptable(message)) {
        throw new Error("Unacceptable message format in logger: " + this.name);
      }
      if (this.useBuffer) {
        return this.messageBuffer.push(message);
      } else {
        return this.log(message);
      }
    };

    Logger.prototype.log = function(message) {
      throw new Error("log() function needs to be overriden to perform actual output!");
    };

    Logger.prototype.processBuffer = function() {
      var obj, _i, _len, _ref;
      if (!(this.messageBuffer.length > 0)) {
        return;
      }
      _ref = this.messageBuffer;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        this.log(obj);
      }
      return this.messageBuffer = [];
    };

    return Logger;

  })();

  Observatory.GenericEmitter = (function(_super) {
    __extends(GenericEmitter, _super);

    function GenericEmitter(name, maxSeverity, formatter) {
      var i, m, _i, _len, _ref;
      this.maxSeverity = maxSeverity;
      if ((formatter != null) && typeof formatter === 'function') {
        this.formatter = formatter;
      } else {
        this.formatter = Observatory.formatters.basicFormatter;
      }
      GenericEmitter.__super__.constructor.call(this, name);
      _ref = ['fatal', 'error', 'warn', 'info', 'verbose', 'debug', 'insaneVerbose'];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        m = _ref[i];
        this[m] = this._emitWithSeverity.bind(this, i);
      }
    }

    GenericEmitter.prototype.trace = function(error, module) {
      var message, _ref;
      message = (_ref = error.stack) != null ? _ref : error;
      return this._emitWithSeverity(Observatory.LOGLEVEL.ERROR, message, module);
    };

    GenericEmitter.prototype._emitWithSeverity = function(severity, message, obj, module) {
      var options;
      if ((severity == null) || severity > this.maxSeverity) {
        return false;
      }
      if (typeof message === 'object') {
        module = obj;
        obj = message;
        message = JSON.stringify(obj);
      }
      if (typeof obj === 'string') {
        module = obj;
        obj = null;
      }
      options = {
        severity: severity,
        message: message,
        obj: obj,
        module: module != null ? module : this.name
      };
      return this.emitMessage(this.formatter(options));
    };

    return GenericEmitter;

  })(Observatory.MessageEmitter);

  Observatory.ConsoleLogger = (function(_super) {
    __extends(ConsoleLogger, _super);

    function ConsoleLogger() {
      _ref = ConsoleLogger.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ConsoleLogger.prototype.log = function(m) {
      return console.log(this.formatter(m));
    };

    return ConsoleLogger;

  })(Observatory.Logger);

  (typeof exports !== "undefined" && exports !== null ? exports : this).Observatory = Observatory;

}).call(this);
