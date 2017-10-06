import postcss from 'postcss';
import parser from 'postcss-value-parser';
import humps from 'humps';
import Promise from 'promise-polyfill';
import resetCore from './reset-core';

if (typeof window !== 'undefined') {
  window.Promise = window.Promise || Promise
} else if (typeof global !== 'undefined') {
  global.Promise = global.Promise || Promise
}

const atRules = {
  global(platefprm) {
    return resetCore.resetGlobal(platefprm);
  },
  nested(...tags) {
    return resetCore.resetNested(tags);
  },
};

let ampInsertedNodes = {};

const unwrapAmp = (nodeSelector, node) => {
  if (nodeSelector.indexOf('&:') >= 0 && node.name !== 'media') {
    return node.selectors.map((selector) => {
      return nodeSelector.replace(/&/g, selector);
    }).join(',');
  }
  return nodeSelector;
};

const getGlobalSelector = (node) => {
  if (node.parent && node.parent.type === 'atrule') {
    return `${node.parent.name} ${node.parent.params} ${node.selector}`;
  } else if (node.name === 'media') {
    return getGlobalSelector(node.parent);
  }
  return node.selector;
};

const applyRuleSetToNode = (ruleSet, node, currentAtRule) => {
  Object.keys(ruleSet).forEach((prop) => {
    let rule = ruleSet[prop];
    if (typeof rule === 'object') {
      if (node.name !== 'media') {
        let extRule = postcss.rule({ selector: unwrapAmp(prop, node) });
        applyRuleSetToNode(rule, extRule);

        let globalSelector = getGlobalSelector(node);
        node.parent.insertAfter(ampInsertedNodes[globalSelector] || node, extRule);
        ampInsertedNodes[globalSelector] = extRule;
      } else {
        let mediaNestedRule = postcss.parse(`${prop} ${JSON.stringify(rule).replace(/"/g, '')}`);
        node.append(mediaNestedRule);
      }
    } else {
      if (currentAtRule) {
        node.insertBefore(currentAtRule, { prop: prop, value: rule });
      } else {
        node.append({ prop, value: rule });
      }
    }
  });
};

const stringifyNode = (node) => {
  if (node.type === 'function') {
    return (node.before || '') + node.value +
      '(' + node.nodes.map(stringifyNode).join('') + ')' +
      (node.after || '');
  } else {
    return (node.before || '') + node.value + (node.after || '');
  }
}

const isPromise = (obj) => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

module.exports = postcss.plugin('postcss-simple-reset', () => {
  return (root) => {
    let promises = [];
    root.walkAtRules('reset', (rule) => {
      let ruleName = rule.params.split(/\(/, 1)[0].trim();
      let ruleFun = atRules[humps.camelize(ruleName)];
      if (ruleFun) {
        let params = [];
        let parsed = parser(rule.params);
        parsed.nodes.forEach(function (node) {
          if (node.type === 'function') {
            node.nodes.forEach(function (i) {
              if (i.type === 'word' || i.type === 'function' ||
                i.type === 'string') {
                  params.push(stringifyNode(i));
              }
            });
          }
        });

        let promise = ruleFun(...params);

        if (isPromise(promise)) {
          promises.push(promise);
        }
        
        promise.then((resolve) => {
          if (typeof resolve === 'object') {
            applyRuleSetToNode(resolve, rule.parent, rule);
          } else {
            root.prepend(resolve);
          }
          rule.remove();
        }).catch(console.error);
      } else {
        throw rule.error('Unknown utility ' + ruleName);
      }
    });
    return Promise.all(promises);
  };
});

