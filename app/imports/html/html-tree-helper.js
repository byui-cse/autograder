import * as HtmlParser from 'parse5';
import HtmlSom from './html-som.js';

class HtmlTreeHelper {

    #attributeData = ['data-', 'is=', 'has='];

    parse(htmlStr = '') {
        const dom = HtmlParser.parse(htmlStr, { sourceCodeLocationInfo: true });

        const struct = {
            // classes: new Map(),
            // data: new Map(),
            som: null,
            src: htmlStr
            // ids: new Map()
        };

        struct.som = this.#walk(dom.childNodes, struct);

        return new HtmlSom(struct);
    }

    #walk(nodes, struct, nodeCount = 1) {
        const maps = new Map();

        nodes.forEach((node) => {
            if (!node.tagName) {
                return;
            }

            // eslint-disable-next-line no-param-reassign
            nodeCount += 1;

            const attrsMap = new Map();
            let attributes = '';
            // const report = {
            //     class: false,
            //     data: false,
            //     id: false
            // };
            if (node.attrs) {
                node.attrs.forEach((attrObj) => {
                    // if (attrObj.name === 'class') {
                    //     report.class = true;
                    // }
                    // // TODO: Change this to a regex test so we can capture custom attributes?
                    // if (this.#attributeData.some((el) => attrObj.name.includes(el))) {
                    //     report.data = true;
                    // }
                    // if (attrObj.name === 'id') {
                    //     report.id = true;
                    // }

                    attrsMap.set(attrObj.name, attrObj.value);
                    attributes += `${attrObj.name}="${attrObj.value}" `;
                });
            }
            attributes = ` ${attributes}`;

            let children = null;
            if (node.childNodes) {
                children = this.#walk(node.childNodes, struct, nodeCount);
            }

            const key = `${node.tagName}${attributes.trimEnd()} N<${nodeCount}>`;

            // if (report.class) {
            //     struct.classes.set(key, maps);
            // }

            // if (report.data) {
            //     struct.data.set(key, maps);
            // }

            // if (report.id) {
            //     struct.ids.set(key, maps);
            // }

            let line = node.sourceCodeLocation.startLine;
            if (node.sourceCodeLocation.endLine !== line) {
                line += `-${node.sourceCodeLocation.endLine}`;
            }

            let col = node.sourceCodeLocation.startCol;
            if (node.sourceCodeLocation.endCol !== col) {
                col += `-${node.sourceCodeLocation.endCol}`;
            }

            // Remove unnecessary location data from the structure we are keeping in memory.
            // eslint-disable-next-line no-param-reassign
            delete node.sourceCodeLocation;

            // eslint-disable-next-line no-param-reassign
            node.loc = {
                line,
                col
            };

            maps.set(key, {
                attrsMap, children, node
            });
        });

        return maps;
    }

}

export default new HtmlTreeHelper();
