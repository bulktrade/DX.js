var DX = {
    Common: {
        EscapeString: function (val) {
            val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
                switch (s) {
                    case "\0":
                        return "\\0";
                    case "\n":
                        return "\\n";
                    case "\r":
                        return "\\r";
                    case "\b":
                        return "\\b";
                    case "\t":
                        return "\\t";
                    case "\x1a":
                        return "\\Z";
                    case "'":
                        return "''";
                    case '"':
                        return '""';
                    default:
                        return "\\" + s;
                }
            });

            return val;
        }
    }
};