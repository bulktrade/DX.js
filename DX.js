var DX = {
    escapeString: function (val) {
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
    },

    /**
     * Merge beta to alpha object.
     *
     * @param alpha
     * @param beta
     * @returns object
     */
    mergeObjects: function (alpha, beta) {
        if (beta) {
            for (var key in beta) {
                if (typeof beta[key] === 'object' && typeof alpha[key] === 'object') {
                    for (var subKey in beta[key]) {
                        alpha[key][subKey] = beta[key][subKey];
                    }
                } else {
                    alpha[key] = beta[key];
                }
            }
        }

        return alpha;
    }
};