const DOMParser = require('xmldom').DOMParser;
var cloner = require('clone');
exports.htmlToTextObjects = function(htmlCodes) {
    htmlCodes = htmlCodes
        .replace(/<br\/?>/g, '<p>[@@DONOT_RENDER_THIS@@]</p>');

    const nodes = new DOMParser().parseFromString(htmlCodes);
    const textObjects = parseNode(nodes).childs;
    //const fixedTextObjects = individualizeText(textObjects);
    return textObjects;
};

function individualizeText(textObjects)
{
    //console.log(textObjects, "origin");
    return textObjects;
}

function getFontSizeRatio(tagName = '') {
    const fontSizeRatio = {
        p: 1, // 14px
        h1: 2.57, // 36px
        h2: 2.14, // 30px
        h3: 1.71, // 24px
        small: 0.7
        // h4: 1.12,
        // h5: 0.83,
        // h6: 0.75
    };
    const matched = fontSizeRatio[tagName.toLowerCase()];
    return (matched) ? matched : 1;
}

function needsLineBreaker(tagName = '') {
    const lineBreakers = [
        'p', 'li', 'h1', 'h2', 'h3'
    ];
    return lineBreakers.includes(tagName);
}

function isBoldTag(tagName = '') {
    const boldTags = ['b', 'strong'];
    return boldTags.includes(tagName);
}

function isItalicTag(tagName = '') {
    const italicTags = ['i', 'em'];
    return italicTags.includes(tagName);
}

function parseNode(node) {
    const attributes = [];
    const styles = {};
    for (let i in node.attributes) {
        if (!isNaN(i)) {
            attributes.push({
                name: node.attributes[i].nodeName,
                value: node.attributes[i].nodeValue
            });
            if (node.attributes[i].nodeName == 'style') {
                const styleValues = node.attributes[i].nodeValue.split(';');
                styleValues.forEach((element) => {
                    if (element && element != '') {
                        element = element.split(':');
                        const key = element[0];
                        let value = element[1].replace(/ /g, '');
                        if (key == 'color') {
                            if (value.search('rgb') > -1) {
                                value = value
                                    .replace(/rgba?\(/, '')
                                    .replace(/\)/, '')
                                    .split(',')
                                    .map(item => parseFloat(item));
                                if (value.length > 3) {
                                    styles['opacity'] = value.pop();
                                }
                            }
                        }
                        styles[key] = value;
                    }
                });
            }
        }
    }
    let value = (node.data) ? node.data.replace(/^\s*/gm, '') : null;
    if (value && value.charCodeAt(0) == 8203) { // zero width space
        value = value.substring(1);
    }
    const parsedData = {
        value,
        tag: node.tagName,
        isBold: isBoldTag(node.tagName),
        isItalic: isItalicTag(node.tagName),
        underline: (node.tagName == 'u'),
        attributes,
        styles,
        needsLineBreaker: needsLineBreaker(node.tagName),
        sizeRatio: getFontSizeRatio(node.tagName),
        link: (node.tagName == 'a') ? node.attributes[0].value : null,
        childs: []
    };
   
    for (let num in node.childNodes) {
        
                console.log("first step");
        let isSomething = isBoldTag(node.childNodes[num].tagName) || isItalicTag(node.childNodes[num].tagName) || node.childNodes[num].tagName == 'u';
          if(isSomething)
       {
           console.log("second");
           console.log(node.childNodes[num].childNodes[0]);
           let childValue = (node.childNodes[num].childNodes[0].data) ? node.childNodes[num].childNodes[0].data.replace(/^\s asterisk /gm, '') : null;
           if (childValue && childValue.charCodeAt(0) == 8203) { // zero width space
            childValue = childValue.substring(1);
            }
            console.log(childValue, "gotchild");
            if(childValue != null)
            {
                console.log(node.childNodes[num].childNodes, "isachild");
                let words = childValue.split(" "); 
                console.log("split well");
                if(words.length>1&&words[words.length-1]=='')
                {
                    words= words.slice(0, words.length-1);
                    
                }
                for(let i=0; i<words.length-1; i++)
                {
                    words[i]= words[i]+" ";
                }
                console.log("edited ewll");
                console.log(typeof node.childNodes[num].childNodes[0]);
                //let duplicateNode = Object.assign({},  node.childNodes[num].childNodes[0]);
                let duplicateNode = cloner(node.childNodes[num].childNodes[0]);
                console.log("duplicated successfully");
                for(let i=0; i<words.length; i++)
                {
                    console.log(duplicateNode.data, "beforechange");
                    duplicateNode.data = words[i];
                    duplicateNode.nodeValue = words[i];
                    console.log(duplicateNode.data, "afterchange");
                    console.log(typeof node.childNodes[num].childNodes);
                    console.log(Array.isArray(node.childNodes[num].childNodes));
                    node.childNodes[num].childNodes[i]=duplicateNode;
                    //node.childNodes[num].childNodes.push(
                      //  parseNode(duplicateNode)
                    //);
                }
                parsedData.childs.push(
                    parseNode(node.childNodes[num])
                );
        }
        else
        {
            parsedData.childs.push(
                parseNode(node.childNodes[num])
            );
        }
       }
       
       else
       {
        parsedData.childs.push(
            parseNode(node.childNodes[num])
        );
       }
        
    }
    const ignoreValue = [
        '\n', '\n\n'
    ];
    parsedData.childs = parsedData.childs.filter(item => {
        return item.tag ||
            (item.value && !ignoreValue.includes(item.value.replace(/ /g, '')));
    });
    return parsedData;
}
