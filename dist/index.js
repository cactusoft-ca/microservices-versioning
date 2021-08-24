require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 3109:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __nccwpck_require__(2186);
const github_1 = __nccwpck_require__(5438);
const linq_to_typescript_1 = __nccwpck_require__(9657);
function getLatestTag(octo, service, owner, repo, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // const graphqlWithAuth = graphql.defaults({
        //   headers: {
        //     authorization: `token ${token}`,
        //   },
        // });
        const { repository } = yield octo.graphql(`
  {
    repository(owner: "${owner}", name: "${repo}") {
      refs(refPrefix: "refs/tags/", query: "${service}", orderBy: {field: TAG_COMMIT_DATE, direction: ASC}, last: 1) {
        edges {
          node {
            name
          }
        }
      }
    }
  }
`);
        const result = repository.refs.edges[0].node.name;
        core_1.debug(`Latest tag for service ${service}: ${result}`);
        return result;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pull_number = core_1.getInput('pull_number');
            const owner = core_1.getInput('owner');
            const repo = core_1.getInput('repo');
            const token = core_1.getInput('token');
            core_1.debug(`Context repo owner: ${github_1.context.repo.owner}`);
            core_1.debug(`Checking labels for pull request number ${pull_number}`);
            const octokit = github_1.getOctokit(token);
            const pull = yield octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
                owner,
                repo,
                pull_number: Number(pull_number)
            });
            const tags = pull.data.labels.map(a => a == null ? '' : a.name);
            const version_priority = ['major', 'minor', 'patch'];
            const versioning_labels = tags.filter(x => version_priority.some(x.includes.bind(x)));
            core_1.debug(`Versioning Labels ${JSON.stringify(versioning_labels)}`);
            const versions_by_service = linq_to_typescript_1.from(versioning_labels).groupBy(function (x) { return x.split(':')[0]; })
                .select(function (x) {
                return {
                    service: x.key,
                    bump: JSON.stringify(x.select(x => x.split(':')[1]).toArray().sort(function (a, b) {
                        const aKey = version_priority.indexOf(a);
                        const bKey = version_priority.indexOf(b);
                        return aKey - bKey;
                    })[0]),
                    latest_version: null
                };
            }).toArray();
            if (versions_by_service.length === 0) {
                core_1.debug('No service to bump');
                return;
            }
            versions_by_service.forEach(function (service) {
                core_1.debug(`Getting actual version for ${service.service}`);
                getLatestTag(octokit, service.service, owner, repo, token)
                    .then((latest_tag) => {
                    service.latest_version = latest_tag;
                }).catch((error) => {
                    core_1.debug(error);
                });
            });
            core_1.debug(JSON.stringify(versions_by_service));
            core_1.setOutput('versions_by_service', versions_by_service);
        }
        catch (error) {
            core_1.setFailed(error.message);
        }
    });
}
run();


/***/ }),

/***/ 7351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__nccwpck_require__(2087));
const utils_1 = __nccwpck_require__(5278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 2186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __nccwpck_require__(7351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(5278);
const os = __importStar(__nccwpck_require__(2087));
const path = __importStar(__nccwpck_require__(5622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    return inputs;
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 */
function error(message) {
    command_1.issue('error', message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 */
function warning(message) {
    command_1.issue('warning', message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

// For internal use, subject to change.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issueCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(5747));
const os = __importStar(__nccwpck_require__(2087));
const utils_1 = __nccwpck_require__(5278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 5278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 4087:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Context = void 0;
const fs_1 = __nccwpck_require__(5747);
const os_1 = __nccwpck_require__(2087);
class Context {
    /**
     * Hydrate the context from the environment
     */
    constructor() {
        var _a, _b, _c;
        this.payload = {};
        if (process.env.GITHUB_EVENT_PATH) {
            if (fs_1.existsSync(process.env.GITHUB_EVENT_PATH)) {
                this.payload = JSON.parse(fs_1.readFileSync(process.env.GITHUB_EVENT_PATH, { encoding: 'utf8' }));
            }
            else {
                const path = process.env.GITHUB_EVENT_PATH;
                process.stdout.write(`GITHUB_EVENT_PATH ${path} does not exist${os_1.EOL}`);
            }
        }
        this.eventName = process.env.GITHUB_EVENT_NAME;
        this.sha = process.env.GITHUB_SHA;
        this.ref = process.env.GITHUB_REF;
        this.workflow = process.env.GITHUB_WORKFLOW;
        this.action = process.env.GITHUB_ACTION;
        this.actor = process.env.GITHUB_ACTOR;
        this.job = process.env.GITHUB_JOB;
        this.runNumber = parseInt(process.env.GITHUB_RUN_NUMBER, 10);
        this.runId = parseInt(process.env.GITHUB_RUN_ID, 10);
        this.apiUrl = (_a = process.env.GITHUB_API_URL) !== null && _a !== void 0 ? _a : `https://api.github.com`;
        this.serverUrl = (_b = process.env.GITHUB_SERVER_URL) !== null && _b !== void 0 ? _b : `https://github.com`;
        this.graphqlUrl = (_c = process.env.GITHUB_GRAPHQL_URL) !== null && _c !== void 0 ? _c : `https://api.github.com/graphql`;
    }
    get issue() {
        const payload = this.payload;
        return Object.assign(Object.assign({}, this.repo), { number: (payload.issue || payload.pull_request || payload).number });
    }
    get repo() {
        if (process.env.GITHUB_REPOSITORY) {
            const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
            return { owner, repo };
        }
        if (this.payload.repository) {
            return {
                owner: this.payload.repository.owner.login,
                repo: this.payload.repository.name
            };
        }
        throw new Error("context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'");
    }
}
exports.Context = Context;
//# sourceMappingURL=context.js.map

/***/ }),

/***/ 5438:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getOctokit = exports.context = void 0;
const Context = __importStar(__nccwpck_require__(4087));
const utils_1 = __nccwpck_require__(3030);
exports.context = new Context.Context();
/**
 * Returns a hydrated octokit ready to use for GitHub Actions
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
function getOctokit(token, options) {
    return new utils_1.GitHub(utils_1.getOctokitOptions(token, options));
}
exports.getOctokit = getOctokit;
//# sourceMappingURL=github.js.map

/***/ }),

/***/ 7914:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getApiBaseUrl = exports.getProxyAgent = exports.getAuthString = void 0;
const httpClient = __importStar(__nccwpck_require__(9925));
function getAuthString(token, options) {
    if (!token && !options.auth) {
        throw new Error('Parameter token or opts.auth is required');
    }
    else if (token && options.auth) {
        throw new Error('Parameters token and opts.auth may not both be specified');
    }
    return typeof options.auth === 'string' ? options.auth : `token ${token}`;
}
exports.getAuthString = getAuthString;
function getProxyAgent(destinationUrl) {
    const hc = new httpClient.HttpClient();
    return hc.getAgent(destinationUrl);
}
exports.getProxyAgent = getProxyAgent;
function getApiBaseUrl() {
    return process.env['GITHUB_API_URL'] || 'https://api.github.com';
}
exports.getApiBaseUrl = getApiBaseUrl;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 3030:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getOctokitOptions = exports.GitHub = exports.context = void 0;
const Context = __importStar(__nccwpck_require__(4087));
const Utils = __importStar(__nccwpck_require__(7914));
// octokit + plugins
const core_1 = __nccwpck_require__(6762);
const plugin_rest_endpoint_methods_1 = __nccwpck_require__(3044);
const plugin_paginate_rest_1 = __nccwpck_require__(4193);
exports.context = new Context.Context();
const baseUrl = Utils.getApiBaseUrl();
const defaults = {
    baseUrl,
    request: {
        agent: Utils.getProxyAgent(baseUrl)
    }
};
exports.GitHub = core_1.Octokit.plugin(plugin_rest_endpoint_methods_1.restEndpointMethods, plugin_paginate_rest_1.paginateRest).defaults(defaults);
/**
 * Convience function to correctly format Octokit Options to pass into the constructor.
 *
 * @param     token    the repo PAT or GITHUB_TOKEN
 * @param     options  other options to set
 */
function getOctokitOptions(token, options) {
    const opts = Object.assign({}, options || {}); // Shallow clone - don't mutate the object provided by the caller
    // Auth
    const auth = Utils.getAuthString(token, opts);
    if (auth) {
        opts.auth = auth;
    }
    return opts;
}
exports.getOctokitOptions = getOctokitOptions;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 9925:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const http = __nccwpck_require__(8605);
const https = __nccwpck_require__(7211);
const pm = __nccwpck_require__(6443);
let tunnel;
var HttpCodes;
(function (HttpCodes) {
    HttpCodes[HttpCodes["OK"] = 200] = "OK";
    HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
    HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
    HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
    HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
    HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
    HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
    HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
    HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
    HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
    HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
    HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
    HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
    HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
    HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
    HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
    HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
    HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
    HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
    HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
    HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
    HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
    HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
var Headers;
(function (Headers) {
    Headers["Accept"] = "accept";
    Headers["ContentType"] = "content-type";
})(Headers = exports.Headers || (exports.Headers = {}));
var MediaTypes;
(function (MediaTypes) {
    MediaTypes["ApplicationJson"] = "application/json";
})(MediaTypes = exports.MediaTypes || (exports.MediaTypes = {}));
/**
 * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
 */
function getProxyUrl(serverUrl) {
    let proxyUrl = pm.getProxyUrl(new URL(serverUrl));
    return proxyUrl ? proxyUrl.href : '';
}
exports.getProxyUrl = getProxyUrl;
const HttpRedirectCodes = [
    HttpCodes.MovedPermanently,
    HttpCodes.ResourceMoved,
    HttpCodes.SeeOther,
    HttpCodes.TemporaryRedirect,
    HttpCodes.PermanentRedirect
];
const HttpResponseRetryCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout
];
const RetryableHttpVerbs = ['OPTIONS', 'GET', 'DELETE', 'HEAD'];
const ExponentialBackoffCeiling = 10;
const ExponentialBackoffTimeSlice = 5;
class HttpClientError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'HttpClientError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }
}
exports.HttpClientError = HttpClientError;
class HttpClientResponse {
    constructor(message) {
        this.message = message;
    }
    readBody() {
        return new Promise(async (resolve, reject) => {
            let output = Buffer.alloc(0);
            this.message.on('data', (chunk) => {
                output = Buffer.concat([output, chunk]);
            });
            this.message.on('end', () => {
                resolve(output.toString());
            });
        });
    }
}
exports.HttpClientResponse = HttpClientResponse;
function isHttps(requestUrl) {
    let parsedUrl = new URL(requestUrl);
    return parsedUrl.protocol === 'https:';
}
exports.isHttps = isHttps;
class HttpClient {
    constructor(userAgent, handlers, requestOptions) {
        this._ignoreSslError = false;
        this._allowRedirects = true;
        this._allowRedirectDowngrade = false;
        this._maxRedirects = 50;
        this._allowRetries = false;
        this._maxRetries = 1;
        this._keepAlive = false;
        this._disposed = false;
        this.userAgent = userAgent;
        this.handlers = handlers || [];
        this.requestOptions = requestOptions;
        if (requestOptions) {
            if (requestOptions.ignoreSslError != null) {
                this._ignoreSslError = requestOptions.ignoreSslError;
            }
            this._socketTimeout = requestOptions.socketTimeout;
            if (requestOptions.allowRedirects != null) {
                this._allowRedirects = requestOptions.allowRedirects;
            }
            if (requestOptions.allowRedirectDowngrade != null) {
                this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
            }
            if (requestOptions.maxRedirects != null) {
                this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
            }
            if (requestOptions.keepAlive != null) {
                this._keepAlive = requestOptions.keepAlive;
            }
            if (requestOptions.allowRetries != null) {
                this._allowRetries = requestOptions.allowRetries;
            }
            if (requestOptions.maxRetries != null) {
                this._maxRetries = requestOptions.maxRetries;
            }
        }
    }
    options(requestUrl, additionalHeaders) {
        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
    }
    get(requestUrl, additionalHeaders) {
        return this.request('GET', requestUrl, null, additionalHeaders || {});
    }
    del(requestUrl, additionalHeaders) {
        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
    }
    post(requestUrl, data, additionalHeaders) {
        return this.request('POST', requestUrl, data, additionalHeaders || {});
    }
    patch(requestUrl, data, additionalHeaders) {
        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
    }
    put(requestUrl, data, additionalHeaders) {
        return this.request('PUT', requestUrl, data, additionalHeaders || {});
    }
    head(requestUrl, additionalHeaders) {
        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
    }
    sendStream(verb, requestUrl, stream, additionalHeaders) {
        return this.request(verb, requestUrl, stream, additionalHeaders);
    }
    /**
     * Gets a typed object from an endpoint
     * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
     */
    async getJson(requestUrl, additionalHeaders = {}) {
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        let res = await this.get(requestUrl, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async postJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.post(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async putJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.put(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async patchJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.patch(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    /**
     * Makes a raw http request.
     * All other methods such as get, post, patch, and request ultimately call this.
     * Prefer get, del, post and patch
     */
    async request(verb, requestUrl, data, headers) {
        if (this._disposed) {
            throw new Error('Client has already been disposed.');
        }
        let parsedUrl = new URL(requestUrl);
        let info = this._prepareRequest(verb, parsedUrl, headers);
        // Only perform retries on reads since writes may not be idempotent.
        let maxTries = this._allowRetries && RetryableHttpVerbs.indexOf(verb) != -1
            ? this._maxRetries + 1
            : 1;
        let numTries = 0;
        let response;
        while (numTries < maxTries) {
            response = await this.requestRaw(info, data);
            // Check if it's an authentication challenge
            if (response &&
                response.message &&
                response.message.statusCode === HttpCodes.Unauthorized) {
                let authenticationHandler;
                for (let i = 0; i < this.handlers.length; i++) {
                    if (this.handlers[i].canHandleAuthentication(response)) {
                        authenticationHandler = this.handlers[i];
                        break;
                    }
                }
                if (authenticationHandler) {
                    return authenticationHandler.handleAuthentication(this, info, data);
                }
                else {
                    // We have received an unauthorized response but have no handlers to handle it.
                    // Let the response return to the caller.
                    return response;
                }
            }
            let redirectsRemaining = this._maxRedirects;
            while (HttpRedirectCodes.indexOf(response.message.statusCode) != -1 &&
                this._allowRedirects &&
                redirectsRemaining > 0) {
                const redirectUrl = response.message.headers['location'];
                if (!redirectUrl) {
                    // if there's no location to redirect to, we won't
                    break;
                }
                let parsedRedirectUrl = new URL(redirectUrl);
                if (parsedUrl.protocol == 'https:' &&
                    parsedUrl.protocol != parsedRedirectUrl.protocol &&
                    !this._allowRedirectDowngrade) {
                    throw new Error('Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.');
                }
                // we need to finish reading the response before reassigning response
                // which will leak the open socket.
                await response.readBody();
                // strip authorization header if redirected to a different hostname
                if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
                    for (let header in headers) {
                        // header names are case insensitive
                        if (header.toLowerCase() === 'authorization') {
                            delete headers[header];
                        }
                    }
                }
                // let's make the request with the new redirectUrl
                info = this._prepareRequest(verb, parsedRedirectUrl, headers);
                response = await this.requestRaw(info, data);
                redirectsRemaining--;
            }
            if (HttpResponseRetryCodes.indexOf(response.message.statusCode) == -1) {
                // If not a retry code, return immediately instead of retrying
                return response;
            }
            numTries += 1;
            if (numTries < maxTries) {
                await response.readBody();
                await this._performExponentialBackoff(numTries);
            }
        }
        return response;
    }
    /**
     * Needs to be called if keepAlive is set to true in request options.
     */
    dispose() {
        if (this._agent) {
            this._agent.destroy();
        }
        this._disposed = true;
    }
    /**
     * Raw request.
     * @param info
     * @param data
     */
    requestRaw(info, data) {
        return new Promise((resolve, reject) => {
            let callbackForResult = function (err, res) {
                if (err) {
                    reject(err);
                }
                resolve(res);
            };
            this.requestRawWithCallback(info, data, callbackForResult);
        });
    }
    /**
     * Raw request with callback.
     * @param info
     * @param data
     * @param onResult
     */
    requestRawWithCallback(info, data, onResult) {
        let socket;
        if (typeof data === 'string') {
            info.options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
        }
        let callbackCalled = false;
        let handleResult = (err, res) => {
            if (!callbackCalled) {
                callbackCalled = true;
                onResult(err, res);
            }
        };
        let req = info.httpModule.request(info.options, (msg) => {
            let res = new HttpClientResponse(msg);
            handleResult(null, res);
        });
        req.on('socket', sock => {
            socket = sock;
        });
        // If we ever get disconnected, we want the socket to timeout eventually
        req.setTimeout(this._socketTimeout || 3 * 60000, () => {
            if (socket) {
                socket.end();
            }
            handleResult(new Error('Request timeout: ' + info.options.path), null);
        });
        req.on('error', function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err, null);
        });
        if (data && typeof data === 'string') {
            req.write(data, 'utf8');
        }
        if (data && typeof data !== 'string') {
            data.on('close', function () {
                req.end();
            });
            data.pipe(req);
        }
        else {
            req.end();
        }
    }
    /**
     * Gets an http agent. This function is useful when you need an http agent that handles
     * routing through a proxy server - depending upon the url and proxy environment variables.
     * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
     */
    getAgent(serverUrl) {
        let parsedUrl = new URL(serverUrl);
        return this._getAgent(parsedUrl);
    }
    _prepareRequest(method, requestUrl, headers) {
        const info = {};
        info.parsedUrl = requestUrl;
        const usingSsl = info.parsedUrl.protocol === 'https:';
        info.httpModule = usingSsl ? https : http;
        const defaultPort = usingSsl ? 443 : 80;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port
            ? parseInt(info.parsedUrl.port)
            : defaultPort;
        info.options.path =
            (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
        info.options.method = method;
        info.options.headers = this._mergeHeaders(headers);
        if (this.userAgent != null) {
            info.options.headers['user-agent'] = this.userAgent;
        }
        info.options.agent = this._getAgent(info.parsedUrl);
        // gives handlers an opportunity to participate
        if (this.handlers) {
            this.handlers.forEach(handler => {
                handler.prepareRequest(info.options);
            });
        }
        return info;
    }
    _mergeHeaders(headers) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        if (this.requestOptions && this.requestOptions.headers) {
            return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers));
        }
        return lowercaseKeys(headers || {});
    }
    _getExistingOrDefaultHeader(additionalHeaders, header, _default) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        let clientHeader;
        if (this.requestOptions && this.requestOptions.headers) {
            clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
        }
        return additionalHeaders[header] || clientHeader || _default;
    }
    _getAgent(parsedUrl) {
        let agent;
        let proxyUrl = pm.getProxyUrl(parsedUrl);
        let useProxy = proxyUrl && proxyUrl.hostname;
        if (this._keepAlive && useProxy) {
            agent = this._proxyAgent;
        }
        if (this._keepAlive && !useProxy) {
            agent = this._agent;
        }
        // if agent is already assigned use that agent.
        if (!!agent) {
            return agent;
        }
        const usingSsl = parsedUrl.protocol === 'https:';
        let maxSockets = 100;
        if (!!this.requestOptions) {
            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
        }
        if (useProxy) {
            // If using proxy, need tunnel
            if (!tunnel) {
                tunnel = __nccwpck_require__(4294);
            }
            const agentOptions = {
                maxSockets: maxSockets,
                keepAlive: this._keepAlive,
                proxy: {
                    ...((proxyUrl.username || proxyUrl.password) && {
                        proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`
                    }),
                    host: proxyUrl.hostname,
                    port: proxyUrl.port
                }
            };
            let tunnelAgent;
            const overHttps = proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            }
            else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }
            agent = tunnelAgent(agentOptions);
            this._proxyAgent = agent;
        }
        // if reusing agent across request and tunneling agent isn't assigned create a new agent
        if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
            agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
            this._agent = agent;
        }
        // if not using private agent and tunnel agent isn't setup then use global agent
        if (!agent) {
            agent = usingSsl ? https.globalAgent : http.globalAgent;
        }
        if (usingSsl && this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, {
                rejectUnauthorized: false
            });
        }
        return agent;
    }
    _performExponentialBackoff(retryNumber) {
        retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
        const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
        return new Promise(resolve => setTimeout(() => resolve(), ms));
    }
    static dateTimeDeserializer(key, value) {
        if (typeof value === 'string') {
            let a = new Date(value);
            if (!isNaN(a.valueOf())) {
                return a;
            }
        }
        return value;
    }
    async _processResponse(res, options) {
        return new Promise(async (resolve, reject) => {
            const statusCode = res.message.statusCode;
            const response = {
                statusCode: statusCode,
                result: null,
                headers: {}
            };
            // not found leads to null obj returned
            if (statusCode == HttpCodes.NotFound) {
                resolve(response);
            }
            let obj;
            let contents;
            // get the result from the body
            try {
                contents = await res.readBody();
                if (contents && contents.length > 0) {
                    if (options && options.deserializeDates) {
                        obj = JSON.parse(contents, HttpClient.dateTimeDeserializer);
                    }
                    else {
                        obj = JSON.parse(contents);
                    }
                    response.result = obj;
                }
                response.headers = res.message.headers;
            }
            catch (err) {
                // Invalid resource (contents not json);  leaving result obj null
            }
            // note that 3xx redirects are handled by the http layer.
            if (statusCode > 299) {
                let msg;
                // if exception/error in body, attempt to get better error
                if (obj && obj.message) {
                    msg = obj.message;
                }
                else if (contents && contents.length > 0) {
                    // it may be the case that the exception is in the body message as string
                    msg = contents;
                }
                else {
                    msg = 'Failed request: (' + statusCode + ')';
                }
                let err = new HttpClientError(msg, statusCode);
                err.result = response.result;
                reject(err);
            }
            else {
                resolve(response);
            }
        });
    }
}
exports.HttpClient = HttpClient;


/***/ }),

/***/ 6443:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function getProxyUrl(reqUrl) {
    let usingSsl = reqUrl.protocol === 'https:';
    let proxyUrl;
    if (checkBypass(reqUrl)) {
        return proxyUrl;
    }
    let proxyVar;
    if (usingSsl) {
        proxyVar = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
    }
    else {
        proxyVar = process.env['http_proxy'] || process.env['HTTP_PROXY'];
    }
    if (proxyVar) {
        proxyUrl = new URL(proxyVar);
    }
    return proxyUrl;
}
exports.getProxyUrl = getProxyUrl;
function checkBypass(reqUrl) {
    if (!reqUrl.hostname) {
        return false;
    }
    let noProxy = process.env['no_proxy'] || process.env['NO_PROXY'] || '';
    if (!noProxy) {
        return false;
    }
    // Determine the request port
    let reqPort;
    if (reqUrl.port) {
        reqPort = Number(reqUrl.port);
    }
    else if (reqUrl.protocol === 'http:') {
        reqPort = 80;
    }
    else if (reqUrl.protocol === 'https:') {
        reqPort = 443;
    }
    // Format the request hostname and hostname with port
    let upperReqHosts = [reqUrl.hostname.toUpperCase()];
    if (typeof reqPort === 'number') {
        upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
    }
    // Compare request host against noproxy
    for (let upperNoProxyItem of noProxy
        .split(',')
        .map(x => x.trim().toUpperCase())
        .filter(x => x)) {
        if (upperReqHosts.some(x => x === upperNoProxyItem)) {
            return true;
        }
    }
    return false;
}
exports.checkBypass = checkBypass;


/***/ }),

/***/ 334:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

async function auth(token) {
  const tokenType = token.split(/\./).length === 3 ? "app" : /^v\d+\./.test(token) ? "installation" : "oauth";
  return {
    type: "token",
    token: token,
    tokenType
  };
}

/**
 * Prefix token for usage in the Authorization header
 *
 * @param token OAuth token or JSON Web Token
 */
function withAuthorizationPrefix(token) {
  if (token.split(/\./).length === 3) {
    return `bearer ${token}`;
  }

  return `token ${token}`;
}

async function hook(token, request, route, parameters) {
  const endpoint = request.endpoint.merge(route, parameters);
  endpoint.headers.authorization = withAuthorizationPrefix(token);
  return request(endpoint);
}

const createTokenAuth = function createTokenAuth(token) {
  if (!token) {
    throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
  }

  if (typeof token !== "string") {
    throw new Error("[@octokit/auth-token] Token passed to createTokenAuth is not a string");
  }

  token = token.replace(/^(token|bearer) +/i, "");
  return Object.assign(auth.bind(null, token), {
    hook: hook.bind(null, token)
  });
};

exports.createTokenAuth = createTokenAuth;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 6762:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

var universalUserAgent = __nccwpck_require__(5030);
var beforeAfterHook = __nccwpck_require__(3682);
var request = __nccwpck_require__(6234);
var graphql = __nccwpck_require__(8467);
var authToken = __nccwpck_require__(334);

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

const VERSION = "3.5.1";

const _excluded = ["authStrategy"];
class Octokit {
  constructor(options = {}) {
    const hook = new beforeAfterHook.Collection();
    const requestDefaults = {
      baseUrl: request.request.endpoint.DEFAULTS.baseUrl,
      headers: {},
      request: Object.assign({}, options.request, {
        // @ts-ignore internal usage only, no need to type
        hook: hook.bind(null, "request")
      }),
      mediaType: {
        previews: [],
        format: ""
      }
    }; // prepend default user agent with `options.userAgent` if set

    requestDefaults.headers["user-agent"] = [options.userAgent, `octokit-core.js/${VERSION} ${universalUserAgent.getUserAgent()}`].filter(Boolean).join(" ");

    if (options.baseUrl) {
      requestDefaults.baseUrl = options.baseUrl;
    }

    if (options.previews) {
      requestDefaults.mediaType.previews = options.previews;
    }

    if (options.timeZone) {
      requestDefaults.headers["time-zone"] = options.timeZone;
    }

    this.request = request.request.defaults(requestDefaults);
    this.graphql = graphql.withCustomRequest(this.request).defaults(requestDefaults);
    this.log = Object.assign({
      debug: () => {},
      info: () => {},
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    }, options.log);
    this.hook = hook; // (1) If neither `options.authStrategy` nor `options.auth` are set, the `octokit` instance
    //     is unauthenticated. The `this.auth()` method is a no-op and no request hook is registered.
    // (2) If only `options.auth` is set, use the default token authentication strategy.
    // (3) If `options.authStrategy` is set then use it and pass in `options.auth`. Always pass own request as many strategies accept a custom request instance.
    // TODO: type `options.auth` based on `options.authStrategy`.

    if (!options.authStrategy) {
      if (!options.auth) {
        // (1)
        this.auth = async () => ({
          type: "unauthenticated"
        });
      } else {
        // (2)
        const auth = authToken.createTokenAuth(options.auth); // @ts-ignore  ¯\_(ツ)_/¯

        hook.wrap("request", auth.hook);
        this.auth = auth;
      }
    } else {
      const {
        authStrategy
      } = options,
            otherOptions = _objectWithoutProperties(options, _excluded);

      const auth = authStrategy(Object.assign({
        request: this.request,
        log: this.log,
        // we pass the current octokit instance as well as its constructor options
        // to allow for authentication strategies that return a new octokit instance
        // that shares the same internal state as the current one. The original
        // requirement for this was the "event-octokit" authentication strategy
        // of https://github.com/probot/octokit-auth-probot.
        octokit: this,
        octokitOptions: otherOptions
      }, options.auth)); // @ts-ignore  ¯\_(ツ)_/¯

      hook.wrap("request", auth.hook);
      this.auth = auth;
    } // apply plugins
    // https://stackoverflow.com/a/16345172


    const classConstructor = this.constructor;
    classConstructor.plugins.forEach(plugin => {
      Object.assign(this, plugin(this, options));
    });
  }

  static defaults(defaults) {
    const OctokitWithDefaults = class extends this {
      constructor(...args) {
        const options = args[0] || {};

        if (typeof defaults === "function") {
          super(defaults(options));
          return;
        }

        super(Object.assign({}, defaults, options, options.userAgent && defaults.userAgent ? {
          userAgent: `${options.userAgent} ${defaults.userAgent}`
        } : null));
      }

    };
    return OctokitWithDefaults;
  }
  /**
   * Attach a plugin (or many) to your Octokit instance.
   *
   * @example
   * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
   */


  static plugin(...newPlugins) {
    var _a;

    const currentPlugins = this.plugins;
    const NewOctokit = (_a = class extends this {}, _a.plugins = currentPlugins.concat(newPlugins.filter(plugin => !currentPlugins.includes(plugin))), _a);
    return NewOctokit;
  }

}
Octokit.VERSION = VERSION;
Octokit.plugins = [];

exports.Octokit = Octokit;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 9440:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

var isPlainObject = __nccwpck_require__(3287);
var universalUserAgent = __nccwpck_require__(5030);

function lowercaseKeys(object) {
  if (!object) {
    return {};
  }

  return Object.keys(object).reduce((newObj, key) => {
    newObj[key.toLowerCase()] = object[key];
    return newObj;
  }, {});
}

function mergeDeep(defaults, options) {
  const result = Object.assign({}, defaults);
  Object.keys(options).forEach(key => {
    if (isPlainObject.isPlainObject(options[key])) {
      if (!(key in defaults)) Object.assign(result, {
        [key]: options[key]
      });else result[key] = mergeDeep(defaults[key], options[key]);
    } else {
      Object.assign(result, {
        [key]: options[key]
      });
    }
  });
  return result;
}

function removeUndefinedProperties(obj) {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }

  return obj;
}

function merge(defaults, route, options) {
  if (typeof route === "string") {
    let [method, url] = route.split(" ");
    options = Object.assign(url ? {
      method,
      url
    } : {
      url: method
    }, options);
  } else {
    options = Object.assign({}, route);
  } // lowercase header names before merging with defaults to avoid duplicates


  options.headers = lowercaseKeys(options.headers); // remove properties with undefined values before merging

  removeUndefinedProperties(options);
  removeUndefinedProperties(options.headers);
  const mergedOptions = mergeDeep(defaults || {}, options); // mediaType.previews arrays are merged, instead of overwritten

  if (defaults && defaults.mediaType.previews.length) {
    mergedOptions.mediaType.previews = defaults.mediaType.previews.filter(preview => !mergedOptions.mediaType.previews.includes(preview)).concat(mergedOptions.mediaType.previews);
  }

  mergedOptions.mediaType.previews = mergedOptions.mediaType.previews.map(preview => preview.replace(/-preview/, ""));
  return mergedOptions;
}

function addQueryParameters(url, parameters) {
  const separator = /\?/.test(url) ? "&" : "?";
  const names = Object.keys(parameters);

  if (names.length === 0) {
    return url;
  }

  return url + separator + names.map(name => {
    if (name === "q") {
      return "q=" + parameters.q.split("+").map(encodeURIComponent).join("+");
    }

    return `${name}=${encodeURIComponent(parameters[name])}`;
  }).join("&");
}

const urlVariableRegex = /\{[^}]+\}/g;

function removeNonChars(variableName) {
  return variableName.replace(/^\W+|\W+$/g, "").split(/,/);
}

function extractUrlVariableNames(url) {
  const matches = url.match(urlVariableRegex);

  if (!matches) {
    return [];
  }

  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
}

function omit(object, keysToOmit) {
  return Object.keys(object).filter(option => !keysToOmit.includes(option)).reduce((obj, key) => {
    obj[key] = object[key];
    return obj;
  }, {});
}

// Based on https://github.com/bramstein/url-template, licensed under BSD
// TODO: create separate package.
//
// Copyright (c) 2012-2014, Bram Stein
// All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//  1. Redistributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in the
//     documentation and/or other materials provided with the distribution.
//  3. The name of the author may not be used to endorse or promote products
//     derived from this software without specific prior written permission.
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
// EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
// EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

/* istanbul ignore file */
function encodeReserved(str) {
  return str.split(/(%[0-9A-Fa-f]{2})/g).map(function (part) {
    if (!/%[0-9A-Fa-f]/.test(part)) {
      part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
    }

    return part;
  }).join("");
}

function encodeUnreserved(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

function encodeValue(operator, value, key) {
  value = operator === "+" || operator === "#" ? encodeReserved(value) : encodeUnreserved(value);

  if (key) {
    return encodeUnreserved(key) + "=" + value;
  } else {
    return value;
  }
}

function isDefined(value) {
  return value !== undefined && value !== null;
}

function isKeyOperator(operator) {
  return operator === ";" || operator === "&" || operator === "?";
}

function getValues(context, operator, key, modifier) {
  var value = context[key],
      result = [];

  if (isDefined(value) && value !== "") {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      value = value.toString();

      if (modifier && modifier !== "*") {
        value = value.substring(0, parseInt(modifier, 10));
      }

      result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
    } else {
      if (modifier === "*") {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function (value) {
            result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
          });
        } else {
          Object.keys(value).forEach(function (k) {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k));
            }
          });
        }
      } else {
        const tmp = [];

        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function (value) {
            tmp.push(encodeValue(operator, value));
          });
        } else {
          Object.keys(value).forEach(function (k) {
            if (isDefined(value[k])) {
              tmp.push(encodeUnreserved(k));
              tmp.push(encodeValue(operator, value[k].toString()));
            }
          });
        }

        if (isKeyOperator(operator)) {
          result.push(encodeUnreserved(key) + "=" + tmp.join(","));
        } else if (tmp.length !== 0) {
          result.push(tmp.join(","));
        }
      }
    }
  } else {
    if (operator === ";") {
      if (isDefined(value)) {
        result.push(encodeUnreserved(key));
      }
    } else if (value === "" && (operator === "&" || operator === "?")) {
      result.push(encodeUnreserved(key) + "=");
    } else if (value === "") {
      result.push("");
    }
  }

  return result;
}

function parseUrl(template) {
  return {
    expand: expand.bind(null, template)
  };
}

function expand(template, context) {
  var operators = ["+", "#", ".", "/", ";", "?", "&"];
  return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
    if (expression) {
      let operator = "";
      const values = [];

      if (operators.indexOf(expression.charAt(0)) !== -1) {
        operator = expression.charAt(0);
        expression = expression.substr(1);
      }

      expression.split(/,/g).forEach(function (variable) {
        var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
        values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
      });

      if (operator && operator !== "+") {
        var separator = ",";

        if (operator === "?") {
          separator = "&";
        } else if (operator !== "#") {
          separator = operator;
        }

        return (values.length !== 0 ? operator : "") + values.join(separator);
      } else {
        return values.join(",");
      }
    } else {
      return encodeReserved(literal);
    }
  });
}

function parse(options) {
  // https://fetch.spec.whatwg.org/#methods
  let method = options.method.toUpperCase(); // replace :varname with {varname} to make it RFC 6570 compatible

  let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
  let headers = Object.assign({}, options.headers);
  let body;
  let parameters = omit(options, ["method", "baseUrl", "url", "headers", "request", "mediaType"]); // extract variable names from URL to calculate remaining variables later

  const urlVariableNames = extractUrlVariableNames(url);
  url = parseUrl(url).expand(parameters);

  if (!/^http/.test(url)) {
    url = options.baseUrl + url;
  }

  const omittedParameters = Object.keys(options).filter(option => urlVariableNames.includes(option)).concat("baseUrl");
  const remainingParameters = omit(parameters, omittedParameters);
  const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);

  if (!isBinaryRequest) {
    if (options.mediaType.format) {
      // e.g. application/vnd.github.v3+json => application/vnd.github.v3.raw
      headers.accept = headers.accept.split(/,/).map(preview => preview.replace(/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/, `application/vnd$1$2.${options.mediaType.format}`)).join(",");
    }

    if (options.mediaType.previews.length) {
      const previewsFromAcceptHeader = headers.accept.match(/[\w-]+(?=-preview)/g) || [];
      headers.accept = previewsFromAcceptHeader.concat(options.mediaType.previews).map(preview => {
        const format = options.mediaType.format ? `.${options.mediaType.format}` : "+json";
        return `application/vnd.github.${preview}-preview${format}`;
      }).join(",");
    }
  } // for GET/HEAD requests, set URL query parameters from remaining parameters
  // for PATCH/POST/PUT/DELETE requests, set request body from remaining parameters


  if (["GET", "HEAD"].includes(method)) {
    url = addQueryParameters(url, remainingParameters);
  } else {
    if ("data" in remainingParameters) {
      body = remainingParameters.data;
    } else {
      if (Object.keys(remainingParameters).length) {
        body = remainingParameters;
      } else {
        headers["content-length"] = 0;
      }
    }
  } // default content-type for JSON if body is set


  if (!headers["content-type"] && typeof body !== "undefined") {
    headers["content-type"] = "application/json; charset=utf-8";
  } // GitHub expects 'content-length: 0' header for PUT/PATCH requests without body.
  // fetch does not allow to set `content-length` header, but we can set body to an empty string


  if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
    body = "";
  } // Only return body/request keys if present


  return Object.assign({
    method,
    url,
    headers
  }, typeof body !== "undefined" ? {
    body
  } : null, options.request ? {
    request: options.request
  } : null);
}

function endpointWithDefaults(defaults, route, options) {
  return parse(merge(defaults, route, options));
}

function withDefaults(oldDefaults, newDefaults) {
  const DEFAULTS = merge(oldDefaults, newDefaults);
  const endpoint = endpointWithDefaults.bind(null, DEFAULTS);
  return Object.assign(endpoint, {
    DEFAULTS,
    defaults: withDefaults.bind(null, DEFAULTS),
    merge: merge.bind(null, DEFAULTS),
    parse
  });
}

const VERSION = "6.0.12";

const userAgent = `octokit-endpoint.js/${VERSION} ${universalUserAgent.getUserAgent()}`; // DEFAULTS has all properties set that EndpointOptions has, except url.
// So we use RequestParameters and add method as additional required property.

const DEFAULTS = {
  method: "GET",
  baseUrl: "https://api.github.com",
  headers: {
    accept: "application/vnd.github.v3+json",
    "user-agent": userAgent
  },
  mediaType: {
    format: "",
    previews: []
  }
};

const endpoint = withDefaults(null, DEFAULTS);

exports.endpoint = endpoint;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 8467:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

var request = __nccwpck_require__(6234);
var universalUserAgent = __nccwpck_require__(5030);

const VERSION = "4.6.4";

class GraphqlError extends Error {
  constructor(request, response) {
    const message = response.data.errors[0].message;
    super(message);
    Object.assign(this, response.data);
    Object.assign(this, {
      headers: response.headers
    });
    this.name = "GraphqlError";
    this.request = request; // Maintains proper stack trace (only available on V8)

    /* istanbul ignore next */

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

}

const NON_VARIABLE_OPTIONS = ["method", "baseUrl", "url", "headers", "request", "query", "mediaType"];
const FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
const GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
function graphql(request, query, options) {
  if (options) {
    if (typeof query === "string" && "query" in options) {
      return Promise.reject(new Error(`[@octokit/graphql] "query" cannot be used as variable name`));
    }

    for (const key in options) {
      if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key)) continue;
      return Promise.reject(new Error(`[@octokit/graphql] "${key}" cannot be used as variable name`));
    }
  }

  const parsedOptions = typeof query === "string" ? Object.assign({
    query
  }, options) : query;
  const requestOptions = Object.keys(parsedOptions).reduce((result, key) => {
    if (NON_VARIABLE_OPTIONS.includes(key)) {
      result[key] = parsedOptions[key];
      return result;
    }

    if (!result.variables) {
      result.variables = {};
    }

    result.variables[key] = parsedOptions[key];
    return result;
  }, {}); // workaround for GitHub Enterprise baseUrl set with /api/v3 suffix
  // https://github.com/octokit/auth-app.js/issues/111#issuecomment-657610451

  const baseUrl = parsedOptions.baseUrl || request.endpoint.DEFAULTS.baseUrl;

  if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
    requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql");
  }

  return request(requestOptions).then(response => {
    if (response.data.errors) {
      const headers = {};

      for (const key of Object.keys(response.headers)) {
        headers[key] = response.headers[key];
      }

      throw new GraphqlError(requestOptions, {
        headers,
        data: response.data
      });
    }

    return response.data.data;
  });
}

function withDefaults(request$1, newDefaults) {
  const newRequest = request$1.defaults(newDefaults);

  const newApi = (query, options) => {
    return graphql(newRequest, query, options);
  };

  return Object.assign(newApi, {
    defaults: withDefaults.bind(null, newRequest),
    endpoint: request.request.endpoint
  });
}

const graphql$1 = withDefaults(request.request, {
  headers: {
    "user-agent": `octokit-graphql.js/${VERSION} ${universalUserAgent.getUserAgent()}`
  },
  method: "POST",
  url: "/graphql"
});
function withCustomRequest(customRequest) {
  return withDefaults(customRequest, {
    method: "POST",
    url: "/graphql"
  });
}

exports.graphql = graphql$1;
exports.withCustomRequest = withCustomRequest;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 4193:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

const VERSION = "2.15.1";

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/**
 * Some “list” response that can be paginated have a different response structure
 *
 * They have a `total_count` key in the response (search also has `incomplete_results`,
 * /installation/repositories also has `repository_selection`), as well as a key with
 * the list of the items which name varies from endpoint to endpoint.
 *
 * Octokit normalizes these responses so that paginated results are always returned following
 * the same structure. One challenge is that if the list response has only one page, no Link
 * header is provided, so this header alone is not sufficient to check wether a response is
 * paginated or not.
 *
 * We check if a "total_count" key is present in the response data, but also make sure that
 * a "url" property is not, as the "Get the combined status for a specific ref" endpoint would
 * otherwise match: https://developer.github.com/v3/repos/statuses/#get-the-combined-status-for-a-specific-ref
 */
function normalizePaginatedListResponse(response) {
  // endpoints can respond with 204 if repository is empty
  if (!response.data) {
    return _objectSpread2(_objectSpread2({}, response), {}, {
      data: []
    });
  }

  const responseNeedsNormalization = "total_count" in response.data && !("url" in response.data);
  if (!responseNeedsNormalization) return response; // keep the additional properties intact as there is currently no other way
  // to retrieve the same information.

  const incompleteResults = response.data.incomplete_results;
  const repositorySelection = response.data.repository_selection;
  const totalCount = response.data.total_count;
  delete response.data.incomplete_results;
  delete response.data.repository_selection;
  delete response.data.total_count;
  const namespaceKey = Object.keys(response.data)[0];
  const data = response.data[namespaceKey];
  response.data = data;

  if (typeof incompleteResults !== "undefined") {
    response.data.incomplete_results = incompleteResults;
  }

  if (typeof repositorySelection !== "undefined") {
    response.data.repository_selection = repositorySelection;
  }

  response.data.total_count = totalCount;
  return response;
}

function iterator(octokit, route, parameters) {
  const options = typeof route === "function" ? route.endpoint(parameters) : octokit.request.endpoint(route, parameters);
  const requestMethod = typeof route === "function" ? route : octokit.request;
  const method = options.method;
  const headers = options.headers;
  let url = options.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!url) return {
          done: true
        };

        try {
          const response = await requestMethod({
            method,
            url,
            headers
          });
          const normalizedResponse = normalizePaginatedListResponse(response); // `response.headers.link` format:
          // '<https://api.github.com/users/aseemk/followers?page=2>; rel="next", <https://api.github.com/users/aseemk/followers?page=2>; rel="last"'
          // sets `url` to undefined if "next" URL is not present or `link` header is not set

          url = ((normalizedResponse.headers.link || "").match(/<([^>]+)>;\s*rel="next"/) || [])[1];
          return {
            value: normalizedResponse
          };
        } catch (error) {
          if (error.status !== 409) throw error;
          url = "";
          return {
            value: {
              status: 200,
              headers: {},
              data: []
            }
          };
        }
      }

    })
  };
}

function paginate(octokit, route, parameters, mapFn) {
  if (typeof parameters === "function") {
    mapFn = parameters;
    parameters = undefined;
  }

  return gather(octokit, [], iterator(octokit, route, parameters)[Symbol.asyncIterator](), mapFn);
}

function gather(octokit, results, iterator, mapFn) {
  return iterator.next().then(result => {
    if (result.done) {
      return results;
    }

    let earlyExit = false;

    function done() {
      earlyExit = true;
    }

    results = results.concat(mapFn ? mapFn(result.value, done) : result.value.data);

    if (earlyExit) {
      return results;
    }

    return gather(octokit, results, iterator, mapFn);
  });
}

const composePaginateRest = Object.assign(paginate, {
  iterator
});

const paginatingEndpoints = ["GET /app/hook/deliveries", "GET /app/installations", "GET /applications/grants", "GET /authorizations", "GET /enterprises/{enterprise}/actions/permissions/organizations", "GET /enterprises/{enterprise}/actions/runner-groups", "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations", "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners", "GET /enterprises/{enterprise}/actions/runners", "GET /enterprises/{enterprise}/actions/runners/downloads", "GET /events", "GET /gists", "GET /gists/public", "GET /gists/starred", "GET /gists/{gist_id}/comments", "GET /gists/{gist_id}/commits", "GET /gists/{gist_id}/forks", "GET /installation/repositories", "GET /issues", "GET /marketplace_listing/plans", "GET /marketplace_listing/plans/{plan_id}/accounts", "GET /marketplace_listing/stubbed/plans", "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts", "GET /networks/{owner}/{repo}/events", "GET /notifications", "GET /organizations", "GET /orgs/{org}/actions/permissions/repositories", "GET /orgs/{org}/actions/runner-groups", "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories", "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/runners", "GET /orgs/{org}/actions/runners", "GET /orgs/{org}/actions/runners/downloads", "GET /orgs/{org}/actions/secrets", "GET /orgs/{org}/actions/secrets/{secret_name}/repositories", "GET /orgs/{org}/blocks", "GET /orgs/{org}/credential-authorizations", "GET /orgs/{org}/events", "GET /orgs/{org}/failed_invitations", "GET /orgs/{org}/hooks", "GET /orgs/{org}/hooks/{hook_id}/deliveries", "GET /orgs/{org}/installations", "GET /orgs/{org}/invitations", "GET /orgs/{org}/invitations/{invitation_id}/teams", "GET /orgs/{org}/issues", "GET /orgs/{org}/members", "GET /orgs/{org}/migrations", "GET /orgs/{org}/migrations/{migration_id}/repositories", "GET /orgs/{org}/outside_collaborators", "GET /orgs/{org}/projects", "GET /orgs/{org}/public_members", "GET /orgs/{org}/repos", "GET /orgs/{org}/team-sync/groups", "GET /orgs/{org}/teams", "GET /orgs/{org}/teams/{team_slug}/discussions", "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments", "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions", "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions", "GET /orgs/{org}/teams/{team_slug}/invitations", "GET /orgs/{org}/teams/{team_slug}/members", "GET /orgs/{org}/teams/{team_slug}/projects", "GET /orgs/{org}/teams/{team_slug}/repos", "GET /orgs/{org}/teams/{team_slug}/team-sync/group-mappings", "GET /orgs/{org}/teams/{team_slug}/teams", "GET /projects/columns/{column_id}/cards", "GET /projects/{project_id}/collaborators", "GET /projects/{project_id}/columns", "GET /repos/{owner}/{repo}/actions/artifacts", "GET /repos/{owner}/{repo}/actions/runners", "GET /repos/{owner}/{repo}/actions/runners/downloads", "GET /repos/{owner}/{repo}/actions/runs", "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts", "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs", "GET /repos/{owner}/{repo}/actions/secrets", "GET /repos/{owner}/{repo}/actions/workflows", "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs", "GET /repos/{owner}/{repo}/assignees", "GET /repos/{owner}/{repo}/autolinks", "GET /repos/{owner}/{repo}/branches", "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations", "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs", "GET /repos/{owner}/{repo}/code-scanning/alerts", "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances", "GET /repos/{owner}/{repo}/code-scanning/analyses", "GET /repos/{owner}/{repo}/collaborators", "GET /repos/{owner}/{repo}/comments", "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions", "GET /repos/{owner}/{repo}/commits", "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head", "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments", "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls", "GET /repos/{owner}/{repo}/commits/{ref}/check-runs", "GET /repos/{owner}/{repo}/commits/{ref}/check-suites", "GET /repos/{owner}/{repo}/commits/{ref}/statuses", "GET /repos/{owner}/{repo}/contributors", "GET /repos/{owner}/{repo}/deployments", "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses", "GET /repos/{owner}/{repo}/events", "GET /repos/{owner}/{repo}/forks", "GET /repos/{owner}/{repo}/git/matching-refs/{ref}", "GET /repos/{owner}/{repo}/hooks", "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries", "GET /repos/{owner}/{repo}/invitations", "GET /repos/{owner}/{repo}/issues", "GET /repos/{owner}/{repo}/issues/comments", "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions", "GET /repos/{owner}/{repo}/issues/events", "GET /repos/{owner}/{repo}/issues/{issue_number}/comments", "GET /repos/{owner}/{repo}/issues/{issue_number}/events", "GET /repos/{owner}/{repo}/issues/{issue_number}/labels", "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions", "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline", "GET /repos/{owner}/{repo}/keys", "GET /repos/{owner}/{repo}/labels", "GET /repos/{owner}/{repo}/milestones", "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels", "GET /repos/{owner}/{repo}/notifications", "GET /repos/{owner}/{repo}/pages/builds", "GET /repos/{owner}/{repo}/projects", "GET /repos/{owner}/{repo}/pulls", "GET /repos/{owner}/{repo}/pulls/comments", "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions", "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments", "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits", "GET /repos/{owner}/{repo}/pulls/{pull_number}/files", "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers", "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews", "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments", "GET /repos/{owner}/{repo}/releases", "GET /repos/{owner}/{repo}/releases/{release_id}/assets", "GET /repos/{owner}/{repo}/secret-scanning/alerts", "GET /repos/{owner}/{repo}/stargazers", "GET /repos/{owner}/{repo}/subscribers", "GET /repos/{owner}/{repo}/tags", "GET /repos/{owner}/{repo}/teams", "GET /repositories", "GET /repositories/{repository_id}/environments/{environment_name}/secrets", "GET /scim/v2/enterprises/{enterprise}/Groups", "GET /scim/v2/enterprises/{enterprise}/Users", "GET /scim/v2/organizations/{org}/Users", "GET /search/code", "GET /search/commits", "GET /search/issues", "GET /search/labels", "GET /search/repositories", "GET /search/topics", "GET /search/users", "GET /teams/{team_id}/discussions", "GET /teams/{team_id}/discussions/{discussion_number}/comments", "GET /teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}/reactions", "GET /teams/{team_id}/discussions/{discussion_number}/reactions", "GET /teams/{team_id}/invitations", "GET /teams/{team_id}/members", "GET /teams/{team_id}/projects", "GET /teams/{team_id}/repos", "GET /teams/{team_id}/team-sync/group-mappings", "GET /teams/{team_id}/teams", "GET /user/blocks", "GET /user/emails", "GET /user/followers", "GET /user/following", "GET /user/gpg_keys", "GET /user/installations", "GET /user/installations/{installation_id}/repositories", "GET /user/issues", "GET /user/keys", "GET /user/marketplace_purchases", "GET /user/marketplace_purchases/stubbed", "GET /user/memberships/orgs", "GET /user/migrations", "GET /user/migrations/{migration_id}/repositories", "GET /user/orgs", "GET /user/public_emails", "GET /user/repos", "GET /user/repository_invitations", "GET /user/starred", "GET /user/subscriptions", "GET /user/teams", "GET /users", "GET /users/{username}/events", "GET /users/{username}/events/orgs/{org}", "GET /users/{username}/events/public", "GET /users/{username}/followers", "GET /users/{username}/following", "GET /users/{username}/gists", "GET /users/{username}/gpg_keys", "GET /users/{username}/keys", "GET /users/{username}/orgs", "GET /users/{username}/projects", "GET /users/{username}/received_events", "GET /users/{username}/received_events/public", "GET /users/{username}/repos", "GET /users/{username}/starred", "GET /users/{username}/subscriptions"];

function isPaginatingEndpoint(arg) {
  if (typeof arg === "string") {
    return paginatingEndpoints.includes(arg);
  } else {
    return false;
  }
}

/**
 * @param octokit Octokit instance
 * @param options Options passed to Octokit constructor
 */

function paginateRest(octokit) {
  return {
    paginate: Object.assign(paginate.bind(null, octokit), {
      iterator: iterator.bind(null, octokit)
    })
  };
}
paginateRest.VERSION = VERSION;

exports.composePaginateRest = composePaginateRest;
exports.isPaginatingEndpoint = isPaginatingEndpoint;
exports.paginateRest = paginateRest;
exports.paginatingEndpoints = paginatingEndpoints;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 3044:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const Endpoints = {
  actions: {
    addSelectedRepoToOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"],
    approveWorkflowRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve"],
    cancelWorkflowRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel"],
    createOrUpdateEnvironmentSecret: ["PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}"],
    createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
    createOrUpdateRepoSecret: ["PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    createRegistrationTokenForOrg: ["POST /orgs/{org}/actions/runners/registration-token"],
    createRegistrationTokenForRepo: ["POST /repos/{owner}/{repo}/actions/runners/registration-token"],
    createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
    createRemoveTokenForRepo: ["POST /repos/{owner}/{repo}/actions/runners/remove-token"],
    createWorkflowDispatch: ["POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"],
    deleteArtifact: ["DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
    deleteEnvironmentSecret: ["DELETE /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}"],
    deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
    deleteRepoSecret: ["DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    deleteSelfHostedRunnerFromOrg: ["DELETE /orgs/{org}/actions/runners/{runner_id}"],
    deleteSelfHostedRunnerFromRepo: ["DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}"],
    deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
    deleteWorkflowRunLogs: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs"],
    disableSelectedRepositoryGithubActionsOrganization: ["DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}"],
    disableWorkflow: ["PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable"],
    downloadArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}"],
    downloadJobLogsForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs"],
    downloadWorkflowRunLogs: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs"],
    enableSelectedRepositoryGithubActionsOrganization: ["PUT /orgs/{org}/actions/permissions/repositories/{repository_id}"],
    enableWorkflow: ["PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable"],
    getAllowedActionsOrganization: ["GET /orgs/{org}/actions/permissions/selected-actions"],
    getAllowedActionsRepository: ["GET /repos/{owner}/{repo}/actions/permissions/selected-actions"],
    getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
    getEnvironmentPublicKey: ["GET /repositories/{repository_id}/environments/{environment_name}/secrets/public-key"],
    getEnvironmentSecret: ["GET /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}"],
    getGithubActionsPermissionsOrganization: ["GET /orgs/{org}/actions/permissions"],
    getGithubActionsPermissionsRepository: ["GET /repos/{owner}/{repo}/actions/permissions"],
    getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
    getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
    getPendingDeploymentsForRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"],
    getRepoPermissions: ["GET /repos/{owner}/{repo}/actions/permissions", {}, {
      renamed: ["actions", "getGithubActionsPermissionsRepository"]
    }],
    getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
    getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    getReviewsForRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals"],
    getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
    getSelfHostedRunnerForRepo: ["GET /repos/{owner}/{repo}/actions/runners/{runner_id}"],
    getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
    getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
    getWorkflowRunUsage: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing"],
    getWorkflowUsage: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing"],
    listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
    listEnvironmentSecrets: ["GET /repositories/{repository_id}/environments/{environment_name}/secrets"],
    listJobsForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"],
    listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
    listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
    listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
    listRunnerApplicationsForRepo: ["GET /repos/{owner}/{repo}/actions/runners/downloads"],
    listSelectedReposForOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}/repositories"],
    listSelectedRepositoriesEnabledGithubActionsOrganization: ["GET /orgs/{org}/actions/permissions/repositories"],
    listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
    listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
    listWorkflowRunArtifacts: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts"],
    listWorkflowRuns: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"],
    listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
    reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
    removeSelectedRepoFromOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"],
    reviewPendingDeploymentsForRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"],
    setAllowedActionsOrganization: ["PUT /orgs/{org}/actions/permissions/selected-actions"],
    setAllowedActionsRepository: ["PUT /repos/{owner}/{repo}/actions/permissions/selected-actions"],
    setGithubActionsPermissionsOrganization: ["PUT /orgs/{org}/actions/permissions"],
    setGithubActionsPermissionsRepository: ["PUT /repos/{owner}/{repo}/actions/permissions"],
    setSelectedReposForOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}/repositories"],
    setSelectedRepositoriesEnabledGithubActionsOrganization: ["PUT /orgs/{org}/actions/permissions/repositories"]
  },
  activity: {
    checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
    deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
    deleteThreadSubscription: ["DELETE /notifications/threads/{thread_id}/subscription"],
    getFeeds: ["GET /feeds"],
    getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
    getThread: ["GET /notifications/threads/{thread_id}"],
    getThreadSubscriptionForAuthenticatedUser: ["GET /notifications/threads/{thread_id}/subscription"],
    listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
    listNotificationsForAuthenticatedUser: ["GET /notifications"],
    listOrgEventsForAuthenticatedUser: ["GET /users/{username}/events/orgs/{org}"],
    listPublicEvents: ["GET /events"],
    listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
    listPublicEventsForUser: ["GET /users/{username}/events/public"],
    listPublicOrgEvents: ["GET /orgs/{org}/events"],
    listReceivedEventsForUser: ["GET /users/{username}/received_events"],
    listReceivedPublicEventsForUser: ["GET /users/{username}/received_events/public"],
    listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
    listRepoNotificationsForAuthenticatedUser: ["GET /repos/{owner}/{repo}/notifications"],
    listReposStarredByAuthenticatedUser: ["GET /user/starred"],
    listReposStarredByUser: ["GET /users/{username}/starred"],
    listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
    listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
    listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
    listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
    markNotificationsAsRead: ["PUT /notifications"],
    markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
    markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
    setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
    setThreadSubscription: ["PUT /notifications/threads/{thread_id}/subscription"],
    starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
    unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"]
  },
  apps: {
    addRepoToInstallation: ["PUT /user/installations/{installation_id}/repositories/{repository_id}"],
    checkToken: ["POST /applications/{client_id}/token"],
    createContentAttachment: ["POST /content_references/{content_reference_id}/attachments", {
      mediaType: {
        previews: ["corsair"]
      }
    }],
    createContentAttachmentForRepo: ["POST /repos/{owner}/{repo}/content_references/{content_reference_id}/attachments", {
      mediaType: {
        previews: ["corsair"]
      }
    }],
    createFromManifest: ["POST /app-manifests/{code}/conversions"],
    createInstallationAccessToken: ["POST /app/installations/{installation_id}/access_tokens"],
    deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
    deleteInstallation: ["DELETE /app/installations/{installation_id}"],
    deleteToken: ["DELETE /applications/{client_id}/token"],
    getAuthenticated: ["GET /app"],
    getBySlug: ["GET /apps/{app_slug}"],
    getInstallation: ["GET /app/installations/{installation_id}"],
    getOrgInstallation: ["GET /orgs/{org}/installation"],
    getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
    getSubscriptionPlanForAccount: ["GET /marketplace_listing/accounts/{account_id}"],
    getSubscriptionPlanForAccountStubbed: ["GET /marketplace_listing/stubbed/accounts/{account_id}"],
    getUserInstallation: ["GET /users/{username}/installation"],
    getWebhookConfigForApp: ["GET /app/hook/config"],
    getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
    listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
    listAccountsForPlanStubbed: ["GET /marketplace_listing/stubbed/plans/{plan_id}/accounts"],
    listInstallationReposForAuthenticatedUser: ["GET /user/installations/{installation_id}/repositories"],
    listInstallations: ["GET /app/installations"],
    listInstallationsForAuthenticatedUser: ["GET /user/installations"],
    listPlans: ["GET /marketplace_listing/plans"],
    listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
    listReposAccessibleToInstallation: ["GET /installation/repositories"],
    listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
    listSubscriptionsForAuthenticatedUserStubbed: ["GET /user/marketplace_purchases/stubbed"],
    listWebhookDeliveries: ["GET /app/hook/deliveries"],
    redeliverWebhookDelivery: ["POST /app/hook/deliveries/{delivery_id}/attempts"],
    removeRepoFromInstallation: ["DELETE /user/installations/{installation_id}/repositories/{repository_id}"],
    resetToken: ["PATCH /applications/{client_id}/token"],
    revokeInstallationAccessToken: ["DELETE /installation/token"],
    scopeToken: ["POST /applications/{client_id}/token/scoped"],
    suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
    unsuspendInstallation: ["DELETE /app/installations/{installation_id}/suspended"],
    updateWebhookConfigForApp: ["PATCH /app/hook/config"]
  },
  billing: {
    getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
    getGithubActionsBillingUser: ["GET /users/{username}/settings/billing/actions"],
    getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
    getGithubPackagesBillingUser: ["GET /users/{username}/settings/billing/packages"],
    getSharedStorageBillingOrg: ["GET /orgs/{org}/settings/billing/shared-storage"],
    getSharedStorageBillingUser: ["GET /users/{username}/settings/billing/shared-storage"]
  },
  checks: {
    create: ["POST /repos/{owner}/{repo}/check-runs"],
    createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
    get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
    getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
    listAnnotations: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations"],
    listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
    listForSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs"],
    listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
    rerequestSuite: ["POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest"],
    setSuitesPreferences: ["PATCH /repos/{owner}/{repo}/check-suites/preferences"],
    update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"]
  },
  codeScanning: {
    deleteAnalysis: ["DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}"],
    getAlert: ["GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}", {}, {
      renamedParameters: {
        alert_id: "alert_number"
      }
    }],
    getAnalysis: ["GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}"],
    getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
    listAlertInstances: ["GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
    listAlertsInstances: ["GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances", {}, {
      renamed: ["codeScanning", "listAlertInstances"]
    }],
    listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
    updateAlert: ["PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}"],
    uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"]
  },
  codesOfConduct: {
    getAllCodesOfConduct: ["GET /codes_of_conduct"],
    getConductCode: ["GET /codes_of_conduct/{key}"],
    getForRepo: ["GET /repos/{owner}/{repo}/community/code_of_conduct", {
      mediaType: {
        previews: ["scarlet-witch"]
      }
    }]
  },
  emojis: {
    get: ["GET /emojis"]
  },
  enterpriseAdmin: {
    disableSelectedOrganizationGithubActionsEnterprise: ["DELETE /enterprises/{enterprise}/actions/permissions/organizations/{org_id}"],
    enableSelectedOrganizationGithubActionsEnterprise: ["PUT /enterprises/{enterprise}/actions/permissions/organizations/{org_id}"],
    getAllowedActionsEnterprise: ["GET /enterprises/{enterprise}/actions/permissions/selected-actions"],
    getGithubActionsPermissionsEnterprise: ["GET /enterprises/{enterprise}/actions/permissions"],
    listSelectedOrganizationsEnabledGithubActionsEnterprise: ["GET /enterprises/{enterprise}/actions/permissions/organizations"],
    setAllowedActionsEnterprise: ["PUT /enterprises/{enterprise}/actions/permissions/selected-actions"],
    setGithubActionsPermissionsEnterprise: ["PUT /enterprises/{enterprise}/actions/permissions"],
    setSelectedOrganizationsEnabledGithubActionsEnterprise: ["PUT /enterprises/{enterprise}/actions/permissions/organizations"]
  },
  gists: {
    checkIsStarred: ["GET /gists/{gist_id}/star"],
    create: ["POST /gists"],
    createComment: ["POST /gists/{gist_id}/comments"],
    delete: ["DELETE /gists/{gist_id}"],
    deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
    fork: ["POST /gists/{gist_id}/forks"],
    get: ["GET /gists/{gist_id}"],
    getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
    getRevision: ["GET /gists/{gist_id}/{sha}"],
    list: ["GET /gists"],
    listComments: ["GET /gists/{gist_id}/comments"],
    listCommits: ["GET /gists/{gist_id}/commits"],
    listForUser: ["GET /users/{username}/gists"],
    listForks: ["GET /gists/{gist_id}/forks"],
    listPublic: ["GET /gists/public"],
    listStarred: ["GET /gists/starred"],
    star: ["PUT /gists/{gist_id}/star"],
    unstar: ["DELETE /gists/{gist_id}/star"],
    update: ["PATCH /gists/{gist_id}"],
    updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"]
  },
  git: {
    createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
    createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
    createRef: ["POST /repos/{owner}/{repo}/git/refs"],
    createTag: ["POST /repos/{owner}/{repo}/git/tags"],
    createTree: ["POST /repos/{owner}/{repo}/git/trees"],
    deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
    getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
    getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
    getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
    getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
    getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
    listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
    updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"]
  },
  gitignore: {
    getAllTemplates: ["GET /gitignore/templates"],
    getTemplate: ["GET /gitignore/templates/{name}"]
  },
  interactions: {
    getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
    getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
    getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
    getRestrictionsForYourPublicRepos: ["GET /user/interaction-limits", {}, {
      renamed: ["interactions", "getRestrictionsForAuthenticatedUser"]
    }],
    removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
    removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
    removeRestrictionsForRepo: ["DELETE /repos/{owner}/{repo}/interaction-limits"],
    removeRestrictionsForYourPublicRepos: ["DELETE /user/interaction-limits", {}, {
      renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"]
    }],
    setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
    setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
    setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
    setRestrictionsForYourPublicRepos: ["PUT /user/interaction-limits", {}, {
      renamed: ["interactions", "setRestrictionsForAuthenticatedUser"]
    }]
  },
  issues: {
    addAssignees: ["POST /repos/{owner}/{repo}/issues/{issue_number}/assignees"],
    addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
    create: ["POST /repos/{owner}/{repo}/issues"],
    createComment: ["POST /repos/{owner}/{repo}/issues/{issue_number}/comments"],
    createLabel: ["POST /repos/{owner}/{repo}/labels"],
    createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
    deleteComment: ["DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
    deleteMilestone: ["DELETE /repos/{owner}/{repo}/milestones/{milestone_number}"],
    get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
    getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
    getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
    getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
    list: ["GET /issues"],
    listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
    listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
    listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
    listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
    listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
    listEventsForTimeline: ["GET /repos/{owner}/{repo}/issues/{issue_number}/timeline", {
      mediaType: {
        previews: ["mockingbird"]
      }
    }],
    listForAuthenticatedUser: ["GET /user/issues"],
    listForOrg: ["GET /orgs/{org}/issues"],
    listForRepo: ["GET /repos/{owner}/{repo}/issues"],
    listLabelsForMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels"],
    listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
    listLabelsOnIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
    lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    removeAllLabels: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    removeAssignees: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees"],
    removeLabel: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}"],
    setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
    updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
    updateMilestone: ["PATCH /repos/{owner}/{repo}/milestones/{milestone_number}"]
  },
  licenses: {
    get: ["GET /licenses/{license}"],
    getAllCommonlyUsed: ["GET /licenses"],
    getForRepo: ["GET /repos/{owner}/{repo}/license"]
  },
  markdown: {
    render: ["POST /markdown"],
    renderRaw: ["POST /markdown/raw", {
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    }]
  },
  meta: {
    get: ["GET /meta"],
    getOctocat: ["GET /octocat"],
    getZen: ["GET /zen"],
    root: ["GET /"]
  },
  migrations: {
    cancelImport: ["DELETE /repos/{owner}/{repo}/import"],
    deleteArchiveForAuthenticatedUser: ["DELETE /user/migrations/{migration_id}/archive", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    deleteArchiveForOrg: ["DELETE /orgs/{org}/migrations/{migration_id}/archive", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    downloadArchiveForOrg: ["GET /orgs/{org}/migrations/{migration_id}/archive", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    getArchiveForAuthenticatedUser: ["GET /user/migrations/{migration_id}/archive", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    getCommitAuthors: ["GET /repos/{owner}/{repo}/import/authors"],
    getImportStatus: ["GET /repos/{owner}/{repo}/import"],
    getLargeFiles: ["GET /repos/{owner}/{repo}/import/large_files"],
    getStatusForAuthenticatedUser: ["GET /user/migrations/{migration_id}", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    listForAuthenticatedUser: ["GET /user/migrations", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    listForOrg: ["GET /orgs/{org}/migrations", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    listReposForOrg: ["GET /orgs/{org}/migrations/{migration_id}/repositories", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    listReposForUser: ["GET /user/migrations/{migration_id}/repositories", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    mapCommitAuthor: ["PATCH /repos/{owner}/{repo}/import/authors/{author_id}"],
    setLfsPreference: ["PATCH /repos/{owner}/{repo}/import/lfs"],
    startForAuthenticatedUser: ["POST /user/migrations"],
    startForOrg: ["POST /orgs/{org}/migrations"],
    startImport: ["PUT /repos/{owner}/{repo}/import"],
    unlockRepoForAuthenticatedUser: ["DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    unlockRepoForOrg: ["DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock", {
      mediaType: {
        previews: ["wyandotte"]
      }
    }],
    updateImport: ["PATCH /repos/{owner}/{repo}/import"]
  },
  orgs: {
    blockUser: ["PUT /orgs/{org}/blocks/{username}"],
    cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
    checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
    checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
    checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
    convertMemberToOutsideCollaborator: ["PUT /orgs/{org}/outside_collaborators/{username}"],
    createInvitation: ["POST /orgs/{org}/invitations"],
    createWebhook: ["POST /orgs/{org}/hooks"],
    deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
    get: ["GET /orgs/{org}"],
    getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
    getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
    getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
    getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
    getWebhookDelivery: ["GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}"],
    list: ["GET /organizations"],
    listAppInstallations: ["GET /orgs/{org}/installations"],
    listBlockedUsers: ["GET /orgs/{org}/blocks"],
    listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
    listForAuthenticatedUser: ["GET /user/orgs"],
    listForUser: ["GET /users/{username}/orgs"],
    listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
    listMembers: ["GET /orgs/{org}/members"],
    listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
    listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
    listPendingInvitations: ["GET /orgs/{org}/invitations"],
    listPublicMembers: ["GET /orgs/{org}/public_members"],
    listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
    listWebhooks: ["GET /orgs/{org}/hooks"],
    pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: ["POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"],
    removeMember: ["DELETE /orgs/{org}/members/{username}"],
    removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
    removeOutsideCollaborator: ["DELETE /orgs/{org}/outside_collaborators/{username}"],
    removePublicMembershipForAuthenticatedUser: ["DELETE /orgs/{org}/public_members/{username}"],
    setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
    setPublicMembershipForAuthenticatedUser: ["PUT /orgs/{org}/public_members/{username}"],
    unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
    update: ["PATCH /orgs/{org}"],
    updateMembershipForAuthenticatedUser: ["PATCH /user/memberships/orgs/{org}"],
    updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
    updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"]
  },
  packages: {
    deletePackageForAuthenticatedUser: ["DELETE /user/packages/{package_type}/{package_name}"],
    deletePackageForOrg: ["DELETE /orgs/{org}/packages/{package_type}/{package_name}"],
    deletePackageVersionForAuthenticatedUser: ["DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}"],
    deletePackageVersionForOrg: ["DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
    getAllPackageVersionsForAPackageOwnedByAnOrg: ["GET /orgs/{org}/packages/{package_type}/{package_name}/versions", {}, {
      renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"]
    }],
    getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}/versions", {}, {
      renamed: ["packages", "getAllPackageVersionsForPackageOwnedByAuthenticatedUser"]
    }],
    getAllPackageVersionsForPackageOwnedByAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}/versions"],
    getAllPackageVersionsForPackageOwnedByOrg: ["GET /orgs/{org}/packages/{package_type}/{package_name}/versions"],
    getAllPackageVersionsForPackageOwnedByUser: ["GET /users/{username}/packages/{package_type}/{package_name}/versions"],
    getPackageForAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}"],
    getPackageForOrganization: ["GET /orgs/{org}/packages/{package_type}/{package_name}"],
    getPackageForUser: ["GET /users/{username}/packages/{package_type}/{package_name}"],
    getPackageVersionForAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}"],
    getPackageVersionForOrganization: ["GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
    getPackageVersionForUser: ["GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
    restorePackageForAuthenticatedUser: ["POST /user/packages/{package_type}/{package_name}/restore{?token}"],
    restorePackageForOrg: ["POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}"],
    restorePackageVersionForAuthenticatedUser: ["POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"],
    restorePackageVersionForOrg: ["POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"]
  },
  projects: {
    addCollaborator: ["PUT /projects/{project_id}/collaborators/{username}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    createCard: ["POST /projects/columns/{column_id}/cards", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    createColumn: ["POST /projects/{project_id}/columns", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    createForAuthenticatedUser: ["POST /user/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    createForOrg: ["POST /orgs/{org}/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    createForRepo: ["POST /repos/{owner}/{repo}/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    delete: ["DELETE /projects/{project_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    deleteCard: ["DELETE /projects/columns/cards/{card_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    deleteColumn: ["DELETE /projects/columns/{column_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    get: ["GET /projects/{project_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    getCard: ["GET /projects/columns/cards/{card_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    getColumn: ["GET /projects/columns/{column_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    getPermissionForUser: ["GET /projects/{project_id}/collaborators/{username}/permission", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listCards: ["GET /projects/columns/{column_id}/cards", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listCollaborators: ["GET /projects/{project_id}/collaborators", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listColumns: ["GET /projects/{project_id}/columns", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listForOrg: ["GET /orgs/{org}/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listForRepo: ["GET /repos/{owner}/{repo}/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listForUser: ["GET /users/{username}/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    moveCard: ["POST /projects/columns/cards/{card_id}/moves", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    moveColumn: ["POST /projects/columns/{column_id}/moves", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    removeCollaborator: ["DELETE /projects/{project_id}/collaborators/{username}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    update: ["PATCH /projects/{project_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    updateCard: ["PATCH /projects/columns/cards/{card_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    updateColumn: ["PATCH /projects/columns/{column_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }]
  },
  pulls: {
    checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    create: ["POST /repos/{owner}/{repo}/pulls"],
    createReplyForReviewComment: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies"],
    createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    createReviewComment: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"],
    deletePendingReview: ["DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"],
    deleteReviewComment: ["DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
    dismissReview: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals"],
    get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
    getReview: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"],
    getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
    list: ["GET /repos/{owner}/{repo}/pulls"],
    listCommentsForReview: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments"],
    listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
    listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
    listRequestedReviewers: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"],
    listReviewComments: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"],
    listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
    listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    removeRequestedReviewers: ["DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"],
    requestReviewers: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"],
    submitReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events"],
    update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
    updateBranch: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch", {
      mediaType: {
        previews: ["lydian"]
      }
    }],
    updateReview: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"],
    updateReviewComment: ["PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}"]
  },
  rateLimit: {
    get: ["GET /rate_limit"]
  },
  reactions: {
    createForCommitComment: ["POST /repos/{owner}/{repo}/comments/{comment_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    createForIssue: ["POST /repos/{owner}/{repo}/issues/{issue_number}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    createForIssueComment: ["POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    createForPullRequestReviewComment: ["POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    createForRelease: ["POST /repos/{owner}/{repo}/releases/{release_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    createForTeamDiscussionCommentInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    createForTeamDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteForCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteForIssue: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteForIssueComment: ["DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteForPullRequestComment: ["DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteForTeamDiscussion: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteForTeamDiscussionComment: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    deleteLegacy: ["DELETE /reactions/{reaction_id}", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }, {
      deprecated: "octokit.rest.reactions.deleteLegacy() is deprecated, see https://docs.github.com/rest/reference/reactions/#delete-a-reaction-legacy"
    }],
    listForCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    listForIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    listForIssueComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    listForPullRequestReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    listForTeamDiscussionCommentInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }],
    listForTeamDiscussionInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions", {
      mediaType: {
        previews: ["squirrel-girl"]
      }
    }]
  },
  repos: {
    acceptInvitation: ["PATCH /user/repository_invitations/{invitation_id}"],
    addAppAccessRestrictions: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps", {}, {
      mapToData: "apps"
    }],
    addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
    addStatusCheckContexts: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts", {}, {
      mapToData: "contexts"
    }],
    addTeamAccessRestrictions: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams", {}, {
      mapToData: "teams"
    }],
    addUserAccessRestrictions: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users", {}, {
      mapToData: "users"
    }],
    checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
    checkVulnerabilityAlerts: ["GET /repos/{owner}/{repo}/vulnerability-alerts", {
      mediaType: {
        previews: ["dorian"]
      }
    }],
    compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
    compareCommitsWithBasehead: ["GET /repos/{owner}/{repo}/compare/{basehead}"],
    createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
    createCommitComment: ["POST /repos/{owner}/{repo}/commits/{commit_sha}/comments"],
    createCommitSignatureProtection: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures", {
      mediaType: {
        previews: ["zzzax"]
      }
    }],
    createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
    createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
    createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
    createDeploymentStatus: ["POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"],
    createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
    createForAuthenticatedUser: ["POST /user/repos"],
    createFork: ["POST /repos/{owner}/{repo}/forks"],
    createInOrg: ["POST /orgs/{org}/repos"],
    createOrUpdateEnvironment: ["PUT /repos/{owner}/{repo}/environments/{environment_name}"],
    createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
    createPagesSite: ["POST /repos/{owner}/{repo}/pages", {
      mediaType: {
        previews: ["switcheroo"]
      }
    }],
    createRelease: ["POST /repos/{owner}/{repo}/releases"],
    createUsingTemplate: ["POST /repos/{template_owner}/{template_repo}/generate", {
      mediaType: {
        previews: ["baptiste"]
      }
    }],
    createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
    declineInvitation: ["DELETE /user/repository_invitations/{invitation_id}"],
    delete: ["DELETE /repos/{owner}/{repo}"],
    deleteAccessRestrictions: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"],
    deleteAdminBranchProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"],
    deleteAnEnvironment: ["DELETE /repos/{owner}/{repo}/environments/{environment_name}"],
    deleteAutolink: ["DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    deleteBranchProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection"],
    deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
    deleteCommitSignatureProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures", {
      mediaType: {
        previews: ["zzzax"]
      }
    }],
    deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
    deleteDeployment: ["DELETE /repos/{owner}/{repo}/deployments/{deployment_id}"],
    deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
    deleteInvitation: ["DELETE /repos/{owner}/{repo}/invitations/{invitation_id}"],
    deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages", {
      mediaType: {
        previews: ["switcheroo"]
      }
    }],
    deletePullRequestReviewProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"],
    deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
    deleteReleaseAsset: ["DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
    disableAutomatedSecurityFixes: ["DELETE /repos/{owner}/{repo}/automated-security-fixes", {
      mediaType: {
        previews: ["london"]
      }
    }],
    disableVulnerabilityAlerts: ["DELETE /repos/{owner}/{repo}/vulnerability-alerts", {
      mediaType: {
        previews: ["dorian"]
      }
    }],
    downloadArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}", {}, {
      renamed: ["repos", "downloadZipballArchive"]
    }],
    downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
    downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
    enableAutomatedSecurityFixes: ["PUT /repos/{owner}/{repo}/automated-security-fixes", {
      mediaType: {
        previews: ["london"]
      }
    }],
    enableVulnerabilityAlerts: ["PUT /repos/{owner}/{repo}/vulnerability-alerts", {
      mediaType: {
        previews: ["dorian"]
      }
    }],
    get: ["GET /repos/{owner}/{repo}"],
    getAccessRestrictions: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"],
    getAdminBranchProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"],
    getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
    getAllStatusCheckContexts: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts"],
    getAllTopics: ["GET /repos/{owner}/{repo}/topics", {
      mediaType: {
        previews: ["mercy"]
      }
    }],
    getAppsWithAccessToProtectedBranch: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps"],
    getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
    getBranchProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection"],
    getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
    getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
    getCollaboratorPermissionLevel: ["GET /repos/{owner}/{repo}/collaborators/{username}/permission"],
    getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
    getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
    getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
    getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
    getCommitSignatureProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures", {
      mediaType: {
        previews: ["zzzax"]
      }
    }],
    getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
    getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
    getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
    getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
    getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
    getDeploymentStatus: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}"],
    getEnvironment: ["GET /repos/{owner}/{repo}/environments/{environment_name}"],
    getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
    getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
    getPages: ["GET /repos/{owner}/{repo}/pages"],
    getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
    getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
    getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
    getPullRequestReviewProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"],
    getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
    getReadme: ["GET /repos/{owner}/{repo}/readme"],
    getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
    getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
    getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
    getStatusChecksProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"],
    getTeamsWithAccessToProtectedBranch: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams"],
    getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
    getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
    getUsersWithAccessToProtectedBranch: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users"],
    getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
    getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
    getWebhookConfigForRepo: ["GET /repos/{owner}/{repo}/hooks/{hook_id}/config"],
    getWebhookDelivery: ["GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}"],
    listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
    listBranches: ["GET /repos/{owner}/{repo}/branches"],
    listBranchesForHeadCommit: ["GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head", {
      mediaType: {
        previews: ["groot"]
      }
    }],
    listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
    listCommentsForCommit: ["GET /repos/{owner}/{repo}/commits/{commit_sha}/comments"],
    listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
    listCommitStatusesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/statuses"],
    listCommits: ["GET /repos/{owner}/{repo}/commits"],
    listContributors: ["GET /repos/{owner}/{repo}/contributors"],
    listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
    listDeploymentStatuses: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"],
    listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
    listForAuthenticatedUser: ["GET /user/repos"],
    listForOrg: ["GET /orgs/{org}/repos"],
    listForUser: ["GET /users/{username}/repos"],
    listForks: ["GET /repos/{owner}/{repo}/forks"],
    listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
    listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
    listLanguages: ["GET /repos/{owner}/{repo}/languages"],
    listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
    listPublic: ["GET /repositories"],
    listPullRequestsAssociatedWithCommit: ["GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls", {
      mediaType: {
        previews: ["groot"]
      }
    }],
    listReleaseAssets: ["GET /repos/{owner}/{repo}/releases/{release_id}/assets"],
    listReleases: ["GET /repos/{owner}/{repo}/releases"],
    listTags: ["GET /repos/{owner}/{repo}/tags"],
    listTeams: ["GET /repos/{owner}/{repo}/teams"],
    listWebhookDeliveries: ["GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries"],
    listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
    merge: ["POST /repos/{owner}/{repo}/merges"],
    pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"],
    removeAppAccessRestrictions: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps", {}, {
      mapToData: "apps"
    }],
    removeCollaborator: ["DELETE /repos/{owner}/{repo}/collaborators/{username}"],
    removeStatusCheckContexts: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts", {}, {
      mapToData: "contexts"
    }],
    removeStatusCheckProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"],
    removeTeamAccessRestrictions: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams", {}, {
      mapToData: "teams"
    }],
    removeUserAccessRestrictions: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users", {}, {
      mapToData: "users"
    }],
    renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
    replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics", {
      mediaType: {
        previews: ["mercy"]
      }
    }],
    requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
    setAdminBranchProtection: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"],
    setAppAccessRestrictions: ["PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps", {}, {
      mapToData: "apps"
    }],
    setStatusCheckContexts: ["PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts", {}, {
      mapToData: "contexts"
    }],
    setTeamAccessRestrictions: ["PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams", {}, {
      mapToData: "teams"
    }],
    setUserAccessRestrictions: ["PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users", {}, {
      mapToData: "users"
    }],
    testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
    transfer: ["POST /repos/{owner}/{repo}/transfer"],
    update: ["PATCH /repos/{owner}/{repo}"],
    updateBranchProtection: ["PUT /repos/{owner}/{repo}/branches/{branch}/protection"],
    updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
    updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
    updateInvitation: ["PATCH /repos/{owner}/{repo}/invitations/{invitation_id}"],
    updatePullRequestReviewProtection: ["PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"],
    updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
    updateReleaseAsset: ["PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    updateStatusCheckPotection: ["PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks", {}, {
      renamed: ["repos", "updateStatusCheckProtection"]
    }],
    updateStatusCheckProtection: ["PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"],
    updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
    updateWebhookConfigForRepo: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config"],
    uploadReleaseAsset: ["POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}", {
      baseUrl: "https://uploads.github.com"
    }]
  },
  search: {
    code: ["GET /search/code"],
    commits: ["GET /search/commits", {
      mediaType: {
        previews: ["cloak"]
      }
    }],
    issuesAndPullRequests: ["GET /search/issues"],
    labels: ["GET /search/labels"],
    repos: ["GET /search/repositories"],
    topics: ["GET /search/topics", {
      mediaType: {
        previews: ["mercy"]
      }
    }],
    users: ["GET /search/users"]
  },
  secretScanning: {
    getAlert: ["GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
    updateAlert: ["PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"]
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: ["PUT /orgs/{org}/teams/{team_slug}/memberships/{username}"],
    addOrUpdateProjectPermissionsInOrg: ["PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    addOrUpdateRepoPermissionsInOrg: ["PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"],
    checkPermissionsForProjectInOrg: ["GET /orgs/{org}/teams/{team_slug}/projects/{project_id}", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    checkPermissionsForRepoInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"],
    create: ["POST /orgs/{org}/teams"],
    createDiscussionCommentInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"],
    createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
    deleteDiscussionCommentInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"],
    deleteDiscussionInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"],
    deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
    getByName: ["GET /orgs/{org}/teams/{team_slug}"],
    getDiscussionCommentInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"],
    getDiscussionInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"],
    getMembershipForUserInOrg: ["GET /orgs/{org}/teams/{team_slug}/memberships/{username}"],
    list: ["GET /orgs/{org}/teams"],
    listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
    listDiscussionCommentsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"],
    listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
    listForAuthenticatedUser: ["GET /user/teams"],
    listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
    listPendingInvitationsInOrg: ["GET /orgs/{org}/teams/{team_slug}/invitations"],
    listProjectsInOrg: ["GET /orgs/{org}/teams/{team_slug}/projects", {
      mediaType: {
        previews: ["inertia"]
      }
    }],
    listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
    removeMembershipForUserInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}"],
    removeProjectInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}"],
    removeRepoInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"],
    updateDiscussionCommentInOrg: ["PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"],
    updateDiscussionInOrg: ["PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"],
    updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"]
  },
  users: {
    addEmailForAuthenticated: ["POST /user/emails"],
    block: ["PUT /user/blocks/{username}"],
    checkBlocked: ["GET /user/blocks/{username}"],
    checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
    checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
    createGpgKeyForAuthenticated: ["POST /user/gpg_keys"],
    createPublicSshKeyForAuthenticated: ["POST /user/keys"],
    deleteEmailForAuthenticated: ["DELETE /user/emails"],
    deleteGpgKeyForAuthenticated: ["DELETE /user/gpg_keys/{gpg_key_id}"],
    deletePublicSshKeyForAuthenticated: ["DELETE /user/keys/{key_id}"],
    follow: ["PUT /user/following/{username}"],
    getAuthenticated: ["GET /user"],
    getByUsername: ["GET /users/{username}"],
    getContextForUser: ["GET /users/{username}/hovercard"],
    getGpgKeyForAuthenticated: ["GET /user/gpg_keys/{gpg_key_id}"],
    getPublicSshKeyForAuthenticated: ["GET /user/keys/{key_id}"],
    list: ["GET /users"],
    listBlockedByAuthenticated: ["GET /user/blocks"],
    listEmailsForAuthenticated: ["GET /user/emails"],
    listFollowedByAuthenticated: ["GET /user/following"],
    listFollowersForAuthenticatedUser: ["GET /user/followers"],
    listFollowersForUser: ["GET /users/{username}/followers"],
    listFollowingForUser: ["GET /users/{username}/following"],
    listGpgKeysForAuthenticated: ["GET /user/gpg_keys"],
    listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
    listPublicEmailsForAuthenticated: ["GET /user/public_emails"],
    listPublicKeysForUser: ["GET /users/{username}/keys"],
    listPublicSshKeysForAuthenticated: ["GET /user/keys"],
    setPrimaryEmailVisibilityForAuthenticated: ["PATCH /user/email/visibility"],
    unblock: ["DELETE /user/blocks/{username}"],
    unfollow: ["DELETE /user/following/{username}"],
    updateAuthenticated: ["PATCH /user"]
  }
};

const VERSION = "5.7.0";

function endpointsToMethods(octokit, endpointsMap) {
  const newMethods = {};

  for (const [scope, endpoints] of Object.entries(endpointsMap)) {
    for (const [methodName, endpoint] of Object.entries(endpoints)) {
      const [route, defaults, decorations] = endpoint;
      const [method, url] = route.split(/ /);
      const endpointDefaults = Object.assign({
        method,
        url
      }, defaults);

      if (!newMethods[scope]) {
        newMethods[scope] = {};
      }

      const scopeMethods = newMethods[scope];

      if (decorations) {
        scopeMethods[methodName] = decorate(octokit, scope, methodName, endpointDefaults, decorations);
        continue;
      }

      scopeMethods[methodName] = octokit.request.defaults(endpointDefaults);
    }
  }

  return newMethods;
}

function decorate(octokit, scope, methodName, defaults, decorations) {
  const requestWithDefaults = octokit.request.defaults(defaults);
  /* istanbul ignore next */

  function withDecorations(...args) {
    // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
    let options = requestWithDefaults.endpoint.merge(...args); // There are currently no other decorations than `.mapToData`

    if (decorations.mapToData) {
      options = Object.assign({}, options, {
        data: options[decorations.mapToData],
        [decorations.mapToData]: undefined
      });
      return requestWithDefaults(options);
    }

    if (decorations.renamed) {
      const [newScope, newMethodName] = decorations.renamed;
      octokit.log.warn(`octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`);
    }

    if (decorations.deprecated) {
      octokit.log.warn(decorations.deprecated);
    }

    if (decorations.renamedParameters) {
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
      const options = requestWithDefaults.endpoint.merge(...args);

      for (const [name, alias] of Object.entries(decorations.renamedParameters)) {
        if (name in options) {
          octokit.log.warn(`"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`);

          if (!(alias in options)) {
            options[alias] = options[name];
          }

          delete options[name];
        }
      }

      return requestWithDefaults(options);
    } // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488


    return requestWithDefaults(...args);
  }

  return Object.assign(withDecorations, requestWithDefaults);
}

function restEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit, Endpoints);
  return {
    rest: api
  };
}
restEndpointMethods.VERSION = VERSION;
function legacyRestEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit, Endpoints);
  return _objectSpread2(_objectSpread2({}, api), {}, {
    rest: api
  });
}
legacyRestEndpointMethods.VERSION = VERSION;

exports.legacyRestEndpointMethods = legacyRestEndpointMethods;
exports.restEndpointMethods = restEndpointMethods;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 537:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var deprecation = __nccwpck_require__(8932);
var once = _interopDefault(__nccwpck_require__(1223));

const logOnceCode = once(deprecation => console.warn(deprecation));
const logOnceHeaders = once(deprecation => console.warn(deprecation));
/**
 * Error with extra properties to help with debugging
 */

class RequestError extends Error {
  constructor(message, statusCode, options) {
    super(message); // Maintains proper stack trace (only available on V8)

    /* istanbul ignore next */

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = "HttpError";
    this.status = statusCode;
    let headers;

    if ("headers" in options && typeof options.headers !== "undefined") {
      headers = options.headers;
    }

    if ("response" in options) {
      this.response = options.response;
      headers = options.response.headers;
    } // redact request credentials without mutating original request options


    const requestCopy = Object.assign({}, options.request);

    if (options.request.headers.authorization) {
      requestCopy.headers = Object.assign({}, options.request.headers, {
        authorization: options.request.headers.authorization.replace(/ .*$/, " [REDACTED]")
      });
    }

    requestCopy.url = requestCopy.url // client_id & client_secret can be passed as URL query parameters to increase rate limit
    // see https://developer.github.com/v3/#increasing-the-unauthenticated-rate-limit-for-oauth-applications
    .replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]") // OAuth tokens can be passed as URL query parameters, although it is not recommended
    // see https://developer.github.com/v3/#oauth2-token-sent-in-a-header
    .replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
    this.request = requestCopy; // deprecations

    Object.defineProperty(this, "code", {
      get() {
        logOnceCode(new deprecation.Deprecation("[@octokit/request-error] `error.code` is deprecated, use `error.status`."));
        return statusCode;
      }

    });
    Object.defineProperty(this, "headers", {
      get() {
        logOnceHeaders(new deprecation.Deprecation("[@octokit/request-error] `error.headers` is deprecated, use `error.response.headers`."));
        return headers || {};
      }

    });
  }

}

exports.RequestError = RequestError;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 6234:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var endpoint = __nccwpck_require__(9440);
var universalUserAgent = __nccwpck_require__(5030);
var isPlainObject = __nccwpck_require__(3287);
var nodeFetch = _interopDefault(__nccwpck_require__(467));
var requestError = __nccwpck_require__(537);

const VERSION = "5.6.1";

function getBufferResponse(response) {
  return response.arrayBuffer();
}

function fetchWrapper(requestOptions) {
  const log = requestOptions.request && requestOptions.request.log ? requestOptions.request.log : console;

  if (isPlainObject.isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body)) {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  let headers = {};
  let status;
  let url;
  const fetch = requestOptions.request && requestOptions.request.fetch || nodeFetch;
  return fetch(requestOptions.url, Object.assign({
    method: requestOptions.method,
    body: requestOptions.body,
    headers: requestOptions.headers,
    redirect: requestOptions.redirect
  }, // `requestOptions.request.agent` type is incompatible
  // see https://github.com/octokit/types.ts/pull/264
  requestOptions.request)).then(async response => {
    url = response.url;
    status = response.status;

    for (const keyAndValue of response.headers) {
      headers[keyAndValue[0]] = keyAndValue[1];
    }

    if ("deprecation" in headers) {
      const matches = headers.link && headers.link.match(/<([^>]+)>; rel="deprecation"/);
      const deprecationLink = matches && matches.pop();
      log.warn(`[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${headers.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`);
    }

    if (status === 204 || status === 205) {
      return;
    } // GitHub API returns 200 for HEAD requests


    if (requestOptions.method === "HEAD") {
      if (status < 400) {
        return;
      }

      throw new requestError.RequestError(response.statusText, status, {
        response: {
          url,
          status,
          headers,
          data: undefined
        },
        request: requestOptions
      });
    }

    if (status === 304) {
      throw new requestError.RequestError("Not modified", status, {
        response: {
          url,
          status,
          headers,
          data: await getResponseData(response)
        },
        request: requestOptions
      });
    }

    if (status >= 400) {
      const data = await getResponseData(response);
      const error = new requestError.RequestError(toErrorMessage(data), status, {
        response: {
          url,
          status,
          headers,
          data
        },
        request: requestOptions
      });
      throw error;
    }

    return getResponseData(response);
  }).then(data => {
    return {
      status,
      url,
      headers,
      data
    };
  }).catch(error => {
    if (error instanceof requestError.RequestError) throw error;
    throw new requestError.RequestError(error.message, 500, {
      request: requestOptions
    });
  });
}

async function getResponseData(response) {
  const contentType = response.headers.get("content-type");

  if (/application\/json/.test(contentType)) {
    return response.json();
  }

  if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
    return response.text();
  }

  return getBufferResponse(response);
}

function toErrorMessage(data) {
  if (typeof data === "string") return data; // istanbul ignore else - just in case

  if ("message" in data) {
    if (Array.isArray(data.errors)) {
      return `${data.message}: ${data.errors.map(JSON.stringify).join(", ")}`;
    }

    return data.message;
  } // istanbul ignore next - just in case


  return `Unknown error: ${JSON.stringify(data)}`;
}

function withDefaults(oldEndpoint, newDefaults) {
  const endpoint = oldEndpoint.defaults(newDefaults);

  const newApi = function (route, parameters) {
    const endpointOptions = endpoint.merge(route, parameters);

    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint.parse(endpointOptions));
    }

    const request = (route, parameters) => {
      return fetchWrapper(endpoint.parse(endpoint.merge(route, parameters)));
    };

    Object.assign(request, {
      endpoint,
      defaults: withDefaults.bind(null, endpoint)
    });
    return endpointOptions.request.hook(request, endpointOptions);
  };

  return Object.assign(newApi, {
    endpoint,
    defaults: withDefaults.bind(null, endpoint)
  });
}

const request = withDefaults(endpoint.endpoint, {
  headers: {
    "user-agent": `octokit-request.js/${VERSION} ${universalUserAgent.getUserAgent()}`
  }
});

exports.request = request;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 3682:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var register = __nccwpck_require__(4670)
var addHook = __nccwpck_require__(5549)
var removeHook = __nccwpck_require__(6819)

// bind with array of arguments: https://stackoverflow.com/a/21792913
var bind = Function.bind
var bindable = bind.bind(bind)

function bindApi (hook, state, name) {
  var removeHookRef = bindable(removeHook, null).apply(null, name ? [state, name] : [state])
  hook.api = { remove: removeHookRef }
  hook.remove = removeHookRef

  ;['before', 'error', 'after', 'wrap'].forEach(function (kind) {
    var args = name ? [state, kind, name] : [state, kind]
    hook[kind] = hook.api[kind] = bindable(addHook, null).apply(null, args)
  })
}

function HookSingular () {
  var singularHookName = 'h'
  var singularHookState = {
    registry: {}
  }
  var singularHook = register.bind(null, singularHookState, singularHookName)
  bindApi(singularHook, singularHookState, singularHookName)
  return singularHook
}

function HookCollection () {
  var state = {
    registry: {}
  }

  var hook = register.bind(null, state)
  bindApi(hook, state)

  return hook
}

var collectionHookDeprecationMessageDisplayed = false
function Hook () {
  if (!collectionHookDeprecationMessageDisplayed) {
    console.warn('[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4')
    collectionHookDeprecationMessageDisplayed = true
  }
  return HookCollection()
}

Hook.Singular = HookSingular.bind()
Hook.Collection = HookCollection.bind()

module.exports = Hook
// expose constructors as a named property for TypeScript
module.exports.Hook = Hook
module.exports.Singular = Hook.Singular
module.exports.Collection = Hook.Collection


/***/ }),

/***/ 5549:
/***/ ((module) => {

module.exports = addHook;

function addHook(state, kind, name, hook) {
  var orig = hook;
  if (!state.registry[name]) {
    state.registry[name] = [];
  }

  if (kind === "before") {
    hook = function (method, options) {
      return Promise.resolve()
        .then(orig.bind(null, options))
        .then(method.bind(null, options));
    };
  }

  if (kind === "after") {
    hook = function (method, options) {
      var result;
      return Promise.resolve()
        .then(method.bind(null, options))
        .then(function (result_) {
          result = result_;
          return orig(result, options);
        })
        .then(function () {
          return result;
        });
    };
  }

  if (kind === "error") {
    hook = function (method, options) {
      return Promise.resolve()
        .then(method.bind(null, options))
        .catch(function (error) {
          return orig(error, options);
        });
    };
  }

  state.registry[name].push({
    hook: hook,
    orig: orig,
  });
}


/***/ }),

/***/ 4670:
/***/ ((module) => {

module.exports = register;

function register(state, name, method, options) {
  if (typeof method !== "function") {
    throw new Error("method for before hook must be a function");
  }

  if (!options) {
    options = {};
  }

  if (Array.isArray(name)) {
    return name.reverse().reduce(function (callback, name) {
      return register.bind(null, state, name, callback, options);
    }, method)();
  }

  return Promise.resolve().then(function () {
    if (!state.registry[name]) {
      return method(options);
    }

    return state.registry[name].reduce(function (method, registered) {
      return registered.hook.bind(null, method, options);
    }, method)();
  });
}


/***/ }),

/***/ 6819:
/***/ ((module) => {

module.exports = removeHook;

function removeHook(state, name, method) {
  if (!state.registry[name]) {
    return;
  }

  var index = state.registry[name]
    .map(function (registered) {
      return registered.orig;
    })
    .indexOf(method);

  if (index === -1) {
    return;
  }

  state.registry[name].splice(index, 1);
}


/***/ }),

/***/ 8932:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

class Deprecation extends Error {
  constructor(message) {
    super(message); // Maintains proper stack trace (only available on V8)

    /* istanbul ignore next */

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = 'Deprecation';
  }

}

exports.Deprecation = Deprecation;


/***/ }),

/***/ 3287:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function isPlainObject(o) {
  var ctor,prot;

  if (isObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (ctor === undefined) return true;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

exports.isPlainObject = isPlainObject;


/***/ }),

/***/ 7563:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/* eslint-disable @typescript-eslint/no-empty-interface */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BasicAsyncEnumerable = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * The class behind IAsyncEnumerable<T>
 * @private
 */
class BasicAsyncEnumerable {
    constructor(iterator) {
        this.iterator = iterator;
        //
    }
    [Symbol.asyncIterator]() {
        return this.iterator();
    }
}
exports.BasicAsyncEnumerable = BasicAsyncEnumerable;


/***/ }),

/***/ 2485:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrderedAsyncEnumerable = void 0;
const asAsyncSortedKeyValues_1 = __nccwpck_require__(2428);
const asAsyncSortedKeyValuesSync_1 = __nccwpck_require__(2652);
const asSortedKeyValues_1 = __nccwpck_require__(703);
const asSortedKeyValuesSync_1 = __nccwpck_require__(8775);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Ordered Async Enumerable
 */
class OrderedAsyncEnumerable extends BasicAsyncEnumerable_1.BasicAsyncEnumerable {
    constructor(orderedPairs) {
        super(async function* () {
            for await (const orderedPair of orderedPairs()) {
                yield* orderedPair;
            }
        });
        this.orderedPairs = orderedPairs;
    }
    static generateAsync(source, keySelector, ascending, comparer) {
        let orderedPairs;
        if (source instanceof OrderedAsyncEnumerable) {
            orderedPairs = async function* () {
                for await (const pair of source.orderedPairs()) {
                    yield* asAsyncSortedKeyValuesSync_1.asAsyncSortedKeyValuesSync(pair, keySelector, ascending, comparer);
                }
            };
        }
        else {
            orderedPairs = () => asAsyncSortedKeyValues_1.asAsyncSortedKeyValues(source, keySelector, ascending, comparer);
        }
        return new OrderedAsyncEnumerable(orderedPairs);
    }
    static generate(source, keySelector, ascending, comparer) {
        let orderedPairs;
        if (source instanceof OrderedAsyncEnumerable) {
            orderedPairs = async function* () {
                for await (const pair of source.orderedPairs()) {
                    yield* asSortedKeyValuesSync_1.asSortedKeyValuesSync(pair, keySelector, ascending, comparer);
                }
            };
        }
        else {
            orderedPairs = () => asSortedKeyValues_1.asSortedKeyValues(source, keySelector, ascending, comparer);
        }
        return new OrderedAsyncEnumerable(orderedPairs);
    }
    thenBy(keySelector, comparer) {
        return OrderedAsyncEnumerable.generate(this, keySelector, true, comparer);
    }
    thenByAsync(keySelector, comparer) {
        return OrderedAsyncEnumerable.generateAsync(this, keySelector, true, comparer);
    }
    thenByDescending(keySelector, comparer) {
        return OrderedAsyncEnumerable.generate(this, keySelector, false, comparer);
    }
    thenByDescendingAsync(keySelector, comparer) {
        return OrderedAsyncEnumerable.generateAsync(this, keySelector, false, comparer);
    }
}
exports.OrderedAsyncEnumerable = OrderedAsyncEnumerable;


/***/ }),

/***/ 7346:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncKeyMap = void 0;
/**
 * Converts values to a key values map.
 * @param source Async Iterable
 * @param keySelector Async Key Selector for Map
 * @returns Promise for a Map for Key to Values
 */
exports.asAsyncKeyMap = async (source, keySelector) => {
    const map = new Map();
    for await (const item of source) {
        const key = await keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 1018:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncKeyMapSync = void 0;
/**
 * Converts values to a key values map.
 * @param source Iterable
 * @param keySelector Async Key Selector for Map
 * @returns Promise for a Map for Key to Values
 */
exports.asAsyncKeyMapSync = async (source, keySelector) => {
    const map = new Map();
    for (const item of source) {
        const key = await keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 2428:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncSortedKeyValues = void 0;
const asAsyncKeyMap_1 = __nccwpck_require__(7346);
/**
 * Sorts values in an Async Iterable based on key and a key comparer.
 * @param source Async Iterable
 * @param keySelector Async Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator of arrays
 */
async function* asAsyncSortedKeyValues(source, keySelector, ascending, comparer) {
    const map = await asAsyncKeyMap_1.asAsyncKeyMap(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asAsyncSortedKeyValues = asAsyncSortedKeyValues;


/***/ }),

/***/ 2652:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncSortedKeyValuesSync = void 0;
const asAsyncKeyMapSync_1 = __nccwpck_require__(1018);
/**
 * Sorts values in an Async Iterable based on key and a key comparer.
 * @param source Iterable
 * @param keySelector Async Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator of arrays
 */
async function* asAsyncSortedKeyValuesSync(source, keySelector, ascending, comparer) {
    const map = await asAsyncKeyMapSync_1.asAsyncKeyMapSync(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asAsyncSortedKeyValuesSync = asAsyncSortedKeyValuesSync;


/***/ }),

/***/ 8636:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asKeyMap = void 0;
/**
 * Converts values to a key values map.
 * @param source Async Iterable
 * @param keySelector Key Selector for Map
 * @returns Promise for a Map for Key to Values
 */
exports.asKeyMap = async (source, keySelector) => {
    const map = new Map();
    for await (const item of source) {
        const key = keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 623:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asKeyMapSync = void 0;
/**
 * Converts values to a key values map.
 * @param source Iterable
 * @param keySelector Key Selector for Map
 * @returns Map for Key to Values
 */
exports.asKeyMapSync = (source, keySelector) => {
    const map = new Map();
    for (const item of source) {
        const key = keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 703:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asSortedKeyValues = void 0;
const asKeyMap_1 = __nccwpck_require__(8636);
/**
 * Sorts values in an Iterable based on key and a key comparer.
 * @param source Async Iterable
 * @param keySelector Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator
 */
async function* asSortedKeyValues(source, keySelector, ascending, comparer) {
    const map = await asKeyMap_1.asKeyMap(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asSortedKeyValues = asSortedKeyValues;


/***/ }),

/***/ 8775:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asSortedKeyValuesSync = void 0;
const asKeyMapSync_1 = __nccwpck_require__(623);
/**
 * Sorts values in an Iterable based on key and a key comparer.
 * @param source Iterable
 * @param keySelector Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 */
function* asSortedKeyValuesSync(source, keySelector, ascending, comparer) {
    const map = asKeyMapSync_1.asKeyMapSync(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asSortedKeyValuesSync = asSortedKeyValuesSync;


/***/ }),

/***/ 3822:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.aggregate = void 0;
const shared_1 = __nccwpck_require__(5897);
function aggregate(source, seedOrFunc, func, resultSelector) {
    if (resultSelector) {
        if (!func) {
            throw new ReferenceError(`TAccumulate function is undefined`);
        }
        return aggregate3(source, seedOrFunc, func, resultSelector);
    }
    else if (func) {
        return aggregate2(source, seedOrFunc, func);
    }
    else {
        return aggregate1(source, seedOrFunc);
    }
}
exports.aggregate = aggregate;
const aggregate1 = async (source, func) => {
    let aggregateValue;
    for await (const value of source) {
        if (aggregateValue) {
            aggregateValue = func(aggregateValue, value);
        }
        else {
            aggregateValue = value;
        }
    }
    if (aggregateValue === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return aggregateValue;
};
const aggregate2 = async (source, seed, func) => {
    let aggregateValue = seed;
    for await (const value of source) {
        aggregateValue = func(aggregateValue, value);
    }
    return aggregateValue;
};
const aggregate3 = async (source, seed, func, resultSelector) => {
    let aggregateValue = seed;
    for await (const value of source) {
        aggregateValue = func(aggregateValue, value);
    }
    return resultSelector(aggregateValue);
};


/***/ }),

/***/ 1383:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.all = void 0;
/**
 * Determines whether all elements of a sequence satisfy a condition.
 * @param source An AsyncIterable<T> that contains the elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
exports.all = async (source, predicate) => {
    for await (const item of source) {
        if (predicate(item) === false) {
            return false;
        }
    }
    return true;
};


/***/ }),

/***/ 4380:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.allAsync = void 0;
/**
 * Determines whether all elements of a sequence satisfy a condition.
 * @param source An AsyncIterable<T> that contains the elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns Whether all elements of a sequence satisfy the condition.
 */
exports.allAsync = async (source, predicate) => {
    for await (const item of source) {
        if (await predicate(item) === false) {
            return false;
        }
    }
    return true;
};


/***/ }),

/***/ 5414:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.any = void 0;
/**
 * Determines whether a sequence contains any elements.
 * If predicate is specified, determines whether any element of a sequence satisfies a condition.
 * @param source The AsyncIterable<T> to check for emptiness or apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
exports.any = (source, predicate) => {
    if (predicate) {
        return any2(source, predicate);
    }
    else {
        return any1(source);
    }
};
const any1 = async (source) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of source) {
        return true;
    }
    return false;
};
const any2 = async (source, predicate) => {
    for await (const item of source) {
        if (predicate(item) === true) {
            return true;
        }
    }
    return false;
};


/***/ }),

/***/ 6897:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.anyAsync = void 0;
/**
 * Determines whether any element of a sequence satisfies a condition.
 * @param source An AsyncIterable<T> whose elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
async function anyAsync(source, predicate) {
    for await (const item of source) {
        if (await predicate(item) === true) {
            return true;
        }
    }
    return false;
}
exports.anyAsync = anyAsync;


/***/ }),

/***/ 441:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asParallel = void 0;
const fromParallel_1 = __nccwpck_require__(3709);
/**
 * Converts an async iterable to a Parallel Enumerable.
 * @param source AsyncIterable<T> to convert to IParallelEnumerable<T>
 * @returns Parallel Enumerable of source
 */
function asParallel(source) {
    async function generator() {
        const data = [];
        for await (const value of source) {
            data.push(value);
        }
        return data;
    }
    return fromParallel_1.fromParallel(0 /* PromiseToArray */, generator);
}
exports.asParallel = asParallel;


/***/ }),

/***/ 950:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.average = void 0;
const shared_1 = __nccwpck_require__(5897);
function average(source, selector) {
    if (selector) {
        return average2(source, selector);
    }
    else {
        return average1(source);
    }
}
exports.average = average;
const average1 = async (source) => {
    let value;
    let count;
    for await (const item of source) {
        value = (value || 0) + item;
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};
const average2 = async (source, func) => {
    let value;
    let count;
    for await (const item of source) {
        value = (value || 0) + func(item);
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};


/***/ }),

/***/ 1525:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.averageAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Computes the average of a sequence of values
 * that are obtained by invoking an async transform function on each element of the input sequence.
 * @param source A sequence of values to calculate the average of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The average value (from the selector) of the specified async sequence
 */
exports.averageAsync = async (source, selector) => {
    let value;
    let count;
    for await (const item of source) {
        value = (value || 0) + await selector(item);
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};


/***/ }),

/***/ 2548:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.concatenate = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Concatenates two sequences.
 * @param first The first sequence to concatenate.
 * @param second The sequence to concatenate to the first sequence.
 * @returns An IAsyncEnumerable<T> that contains the concatenated elements of the two input sequences.
 */
function concatenate(first, second) {
    async function* iterator() {
        yield* first;
        yield* second;
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.concatenate = concatenate;


/***/ }),

/***/ 9498:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contains = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Determines whether a sequence contains a specified element by using the specified or default IEqualityComparer<T>.
 * @param source A sequence in which to locate a value.
 * @param value The value to locate in the sequence.
 * @param comparer An equality comparer to compare values. Optional.
 * @returns Whether a sequence contains a specified element
 */
async function contains(source, value, comparer = shared_1.StrictEqualityComparer) {
    for await (const item of source) {
        if (comparer(value, item)) {
            return true;
        }
    }
    return false;
}
exports.contains = contains;


/***/ }),

/***/ 6486:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.containsAsync = void 0;
/**
 * Determines whether a sequence contains a specified element by using the specified or default IEqualityComparer<T>.
 * @param source A sequence in which to locate a value.
 * @param value The value to locate in the sequence.
 * @param comparer An equality comparer to compare values. Optional.
 * @returns Whether or not the async sequence contains the specified value
 */
exports.containsAsync = async (source, value, comparer) => {
    for await (const item of source) {
        if (await comparer(value, item)) {
            return true;
        }
    }
    return false;
};


/***/ }),

/***/ 1283:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.count = void 0;
/**
 * Returns the number of elements in a sequence
 * or represents how many elements in the specified sequence satisfy a condition
 * if the predicate is specified.
 * @param source A sequence that contains elements to be counted.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The number of elements in the input sequence.
 */
exports.count = (source, predicate) => {
    if (predicate) {
        return count2(source, predicate);
    }
    else {
        return count1(source);
    }
};
const count1 = async (source) => {
    let total = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of source) {
        total++;
    }
    return total;
};
const count2 = async (source, predicate) => {
    let total = 0;
    for await (const value of source) {
        if (predicate(value) === true) {
            total++;
        }
    }
    return total;
};


/***/ }),

/***/ 4686:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.countAsync = void 0;
/**
 * Returns the number of elements in a sequence
 * or represents how many elements in the specified sequence satisfy a condition
 * if the predicate is specified.
 * @param source A sequence that contains elements to be counted.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The number of elements in the sequence.
 */
exports.countAsync = async (source, predicate) => {
    let count = 0;
    for await (const value of source) {
        if (await predicate(value) === true) {
            count++;
        }
    }
    return count;
};


/***/ }),

/***/ 1289:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.distinct = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Returns distinct elements from a sequence by using the default or specified equality comparer to compare values.
 * @param source The sequence to remove duplicate elements from.
 * @param comparer An IEqualityComparer<T> to compare values. Optional. Defaults to Strict Equality Comparison.
 * @returns An IAsyncEnumerable<T> that contains distinct elements from the source sequence.
 */
function distinct(source, comparer = shared_1.StrictEqualityComparer) {
    async function* iterator() {
        const distinctElements = [];
        for await (const item of source) {
            const foundItem = distinctElements.find((x) => comparer(x, item));
            if (!foundItem) {
                distinctElements.push(item);
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.distinct = distinct;


/***/ }),

/***/ 9106:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.distinctAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Returns distinct elements from a sequence by using the specified equality comparer to compare values.
 * @param source The sequence to remove duplicate elements from.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns An IAsyncEnumerable<T> that contains distinct elements from the source sequence.
 */
exports.distinctAsync = (source, comparer) => {
    async function* iterator() {
        const distinctElements = [];
        outerLoop: for await (const item of source) {
            for (const distinctElement of distinctElements) {
                const found = await comparer(distinctElement, item);
                if (found) {
                    continue outerLoop;
                }
            }
            distinctElements.push(item);
            yield item;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 2763:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.each = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Performs a specified action on each element of the Iterable<TSource>
 * @param source The source to iterate
 * @param action The action to take an each element
 * @returns A new IAsyncEnumerable<T> that executes the action lazily as you iterate.
 */
exports.each = (source, action) => {
    async function* iterator() {
        for await (const value of source) {
            action(value);
            yield value;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 2610:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.eachAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Performs a specified action on each element of the AsyncIterable<TSource>
 * @param source The source to iterate
 * @param action The action to take an each element
 * @returns A new IAsyncEnumerable<T> that executes the action lazily as you iterate.
 */
exports.eachAsync = (source, action) => {
    async function* iterator() {
        for await (const value of source) {
            await action(value);
            yield value;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 5484:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elementAt = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the element at a specified index in a sequence.
 * @param source An IEnumerable<T> to return an element from.
 * @param index The zero-based index of the element to retrieve.
 * @throws {ArgumentOutOfRangeException}
 * index is less than 0 or greater than or equal to the number of elements in source.
 * @returns Element at the specified index in the sequence.
 */
exports.elementAt = async (source, index) => {
    if (index < 0) {
        throw new shared_1.ArgumentOutOfRangeException("index");
    }
    let i = 0;
    for await (const item of source) {
        if (index === i++) {
            return item;
        }
    }
    throw new shared_1.ArgumentOutOfRangeException("index");
};


/***/ }),

/***/ 407:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elementAtOrDefault = void 0;
/**
 * Returns the element at a specified index in a sequence or a default value if the index is out of range.
 * @param source An IEnumerable<T> to return an element from.
 * @param index The zero-based index of the element to retrieve.
 * @returns
 * default(TSource) if the index is outside the bounds of the source sequence;
 * otherwise, the element at the specified position in the source sequence.
 */
exports.elementAtOrDefault = async (source, index) => {
    let i = 0;
    for await (const item of source) {
        if (index === i++) {
            return item;
        }
    }
    return null;
};


/***/ }),

/***/ 6061:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.except = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Produces the set difference of two sequences by using the comparer provided
 * or EqualityComparer to compare values.
 * @param first An AsyncIterable<T> whose elements that are not also in second will be returned.
 * @param second An AsyncIterable<T> whose elements that also occur in the first sequence
 * will cause those elements to be removed from the returned sequence.
 * @param comparer An IEqualityComparer<T> to compare values. Optional.
 * @returns A sequence that contains the set difference of the elements of two sequences.
 */
exports.except = (first, second, comparer = shared_1.StrictEqualityComparer) => {
    async function* iterator() {
        // TODO: async eq of [...second] ?
        const secondArray = [];
        for await (const x of second) {
            secondArray.push(x);
        }
        for await (const firstItem of first) {
            let exists = false;
            for (let j = 0; j < secondArray.length; j++) {
                const secondItem = secondArray[j];
                if (comparer(firstItem, secondItem) === true) {
                    exists = true;
                    break;
                }
            }
            if (exists === false) {
                yield firstItem;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 6349:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.exceptAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Produces the set difference of two sequences by using the comparer provided to compare values.
 * @param first An AsyncIterable<T> whose elements that are not also in second will be returned.
 * @param second An AsyncIterable<T> whose elements that also occur in the first sequence
 * will cause those elements to be removed from the returned sequence.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns A sequence that contains the set difference of the elements of two sequences.
 */
function exceptAsync(first, second, comparer) {
    async function* iterator() {
        // TODO: async eq of [...second] ?
        const secondArray = [];
        for await (const x of second) {
            secondArray.push(x);
        }
        for await (const firstItem of first) {
            let exists = false;
            for (let j = 0; j < secondArray.length; j++) {
                const secondItem = secondArray[j];
                if (await comparer(firstItem, secondItem) === true) {
                    exists = true;
                    break;
                }
            }
            if (exists === false) {
                yield firstItem;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.exceptAsync = exceptAsync;


/***/ }),

/***/ 8281:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.first = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the first element of a sequence.
 * If predicate is specified, returns the first element in a sequence that satisfies a specified condition.
 * @param source The AsyncIterable<T> to return the first element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The first element in the specified sequence.
 * If predicate is specified,
 * the first element in the sequence that passes the test in the specified predicate function.
 */
exports.first = (source, predicate) => {
    if (predicate) {
        return first2(source, predicate);
    }
    else {
        return first1(source);
    }
};
const first1 = async (source) => {
    const firstElement = await source[Symbol.asyncIterator]().next();
    if (firstElement.done === true) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return firstElement.value;
};
const first2 = async (source, predicate) => {
    for await (const value of source) {
        if (predicate(value) === true) {
            return value;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
};


/***/ }),

/***/ 6322:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the first element in a sequence that satisfies a specified condition.
 * @param source An AsyncIterable<T> to return an element from.
 * @param predicate An async function to test each element for a condition.
 * @throws {InvalidOperationException} No elements in Iteration matching predicate
 * @returns The first element in the sequence that passes the test in the specified predicate function.
 */
async function firstAsync(source, predicate) {
    for await (const value of source) {
        if (await predicate(value) === true) {
            return value;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
}
exports.firstAsync = firstAsync;


/***/ }),

/***/ 886:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstOrDefault = void 0;
/**
 * Returns first element in sequence that satisfies predicate otherwise
 * returns the first element in the sequence. Returns null if no value found.
 * @param source An AsyncIterable<T> to return an element from.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The first element in the sequence
 * or the first element that passes the test in the specified predicate function.
 * Returns null if no value found.
 */
function firstOrDefault(source, predicate) {
    if (predicate) {
        return firstOrDefault2(source, predicate);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return firstOrDefault1(source);
    }
}
exports.firstOrDefault = firstOrDefault;
const firstOrDefault1 = async (source) => {
    const first = await source[Symbol.asyncIterator]().next();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return first.value || null;
};
const firstOrDefault2 = async (source, predicate) => {
    for await (const value of source) {
        if (predicate(value) === true) {
            return value;
        }
    }
    return null;
};


/***/ }),

/***/ 2619:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstOrDefaultAsync = void 0;
/**
 * Returns first element in sequence that satisfies. Returns null if no value found.
 * @param source An AsyncIterable<T> to return an element from.
 * @param predicate An async function to test each element for a condition.
 * @returns The first element that passes the test in the specified predicate function.
 * Returns null if no value found.
 */
async function firstOrDefaultAsync(source, predicate) {
    for await (const value of source) {
        if (await predicate(value) === true) {
            return value;
        }
    }
    return null;
}
exports.firstOrDefaultAsync = firstOrDefaultAsync;


/***/ }),

/***/ 6617:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupBy = void 0;
const Grouping_1 = __nccwpck_require__(891);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function groupBy(source, keySelector, comparer) {
    if (comparer) {
        return groupBy_0(source, keySelector, comparer);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return groupBy_0_Simple(source, keySelector);
    }
}
exports.groupBy = groupBy;
function groupBy_0(source, keySelector, comparer) {
    async function* generate() {
        const keyMap = new Array();
        for await (const value of source) {
            const key = keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (comparer(group.key, key)) {
                    group.push(value);
                    found = true;
                    break;
                }
            }
            if (found === false) {
                keyMap.push(new Grouping_1.Grouping(key, value)); // TODO
            }
        }
        for (const g of keyMap) {
            yield g;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(generate);
}
function groupBy_0_Simple(source, keySelector) {
    async function* iterator() {
        const keyMap = {};
        for await (const value of source) {
            const key = keySelector(value);
            const grouping = keyMap[key];
            if (grouping) {
                grouping.push(value);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, value);
            }
        }
        // eslint-disable-next-line guard-for-in
        for (const value in keyMap) {
            yield keyMap[value];
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}


/***/ }),

/***/ 4376:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupByAsync = void 0;
const Grouping_1 = __nccwpck_require__(891);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function groupByAsync(source, keySelector, comparer) {
    if (comparer) {
        return groupByAsync_0(source, keySelector, comparer);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return groupByAsync_0_Simple(source, keySelector);
    }
}
exports.groupByAsync = groupByAsync;
function groupByAsync_0_Simple(source, keySelector) {
    async function* iterator() {
        const keyMap = {}; // TODO
        for await (const value of source) {
            const key = await keySelector(value);
            const grouping = keyMap[key];
            if (grouping) {
                grouping.push(value);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, value);
            }
        }
        // eslint-disable-next-line guard-for-in
        for (const value in keyMap) {
            yield keyMap[value];
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
function groupByAsync_0(source, keySelector, comparer) {
    async function* generate() {
        const keyMap = new Array();
        for await (const value of source) {
            const key = await keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (await comparer(group.key, key) === true) {
                    group.push(value);
                    found = true;
                    break;
                }
            }
            if (found === false) {
                keyMap.push(new Grouping_1.Grouping(key, value));
            }
        }
        for (const keyValue of keyMap) {
            yield keyValue;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(generate);
}


/***/ }),

/***/ 8207:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupByWithSel = void 0;
const Grouping_1 = __nccwpck_require__(891);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function groupByWithSel(source, keySelector, elementSelector, comparer) {
    if (comparer) {
        return groupBy1(source, keySelector, elementSelector, comparer);
    }
    else {
        return groupBy1Simple(source, keySelector, elementSelector);
    }
}
exports.groupByWithSel = groupByWithSel;
const groupBy1Simple = (source, keySelector, elementSelector) => {
    async function* generate() {
        const keyMap = {};
        for await (const value of source) {
            const key = keySelector(value);
            const grouping = keyMap[key];
            const element = elementSelector(value);
            if (grouping) {
                grouping.push(element);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, element);
            }
        }
        // eslint-disable-next-line guard-for-in
        for (const value in keyMap) {
            yield keyMap[value];
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(generate);
};
const groupBy1 = (source, keySelector, elementSelector, comparer) => {
    async function* generate() {
        const keyMap = new Array();
        for await (const value of source) {
            const key = keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (comparer(group.key, key)) {
                    group.push(elementSelector(value));
                    found = true;
                    break;
                }
            }
            if (found === false) {
                const element = elementSelector(value);
                keyMap.push(new Grouping_1.Grouping(key, element)); // TODO
            }
        }
        for (const value of keyMap) {
            yield value;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(generate);
};


/***/ }),

/***/ 7728:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.intersect = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Produces the set intersection of two sequences by using the specified IEqualityComparer<T> to compare values.
 * If not comparer is specified, uses the @see {StrictEqualityComparer}
 * @param first An IAsyncEnumerable<T> whose distinct elements that also appear in second will be returned.
 * @param second An IAsyncEnumerable<T> whose distinct elements that also appear in the first sequence will be returned.
 * @param comparer An IAsyncEqualityComparer<T> to compare values. Optional.
 * @returns A sequence that contains the elements that form the set intersection of two sequences.
 */
function intersect(first, second, comparer = shared_1.StrictEqualityComparer) {
    async function* iterator() {
        const firstResults = await first.distinct(comparer).toArray();
        if (firstResults.length === 0) {
            return;
        }
        const secondResults = await second.toArray();
        for (let i = 0; i < firstResults.length; i++) {
            const firstValue = firstResults[i];
            for (let j = 0; j < secondResults.length; j++) {
                const secondValue = secondResults[j];
                if (comparer(firstValue, secondValue) === true) {
                    yield firstValue;
                    break;
                }
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.intersect = intersect;


/***/ }),

/***/ 1736:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.intersectAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Produces the set intersection of two sequences by using the specified IAsyncEqualityComparer<T> to compare values.
 * @param first An IAsyncEnumerable<T> whose distinct elements that also appear in second will be returned.
 * @param second An IAsyncEnumerable<T> whose distinct elements that also appear in the first sequence will be returned.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns A sequence that contains the elements that form the set intersection of two sequences.
 */
function intersectAsync(first, second, comparer) {
    async function* iterator() {
        const firstResults = await first.distinctAsync(comparer).toArray();
        if (firstResults.length === 0) {
            return;
        }
        const secondResults = await second.toArray();
        for (let i = 0; i < firstResults.length; i++) {
            const firstValue = firstResults[i];
            for (let j = 0; j < secondResults.length; j++) {
                const secondValue = secondResults[j];
                if (await comparer(firstValue, secondValue) === true) {
                    yield firstValue;
                    break;
                }
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.intersectAsync = intersectAsync;


/***/ }),

/***/ 165:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.join = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Correlates the elements of two sequences based on matching keys.
 * A specified IEqualityComparer<T> is used to compare keys or the strict equality comparer.
 * @param outer The first sequence to join.
 * @param inner The sequence to join to the first sequence.
 * @param outerKeySelector A function to extract the join key from each element of the first sequence.
 * @param innerKeySelector A function to extract the join key from each element of the second sequence.
 * @param resultSelector A function to create a result element from two matching elements.
 * @param comparer An IEqualityComparer<T> to hash and compare keys. Optional.
 * @returns An IAsyncEnumerable<T> that has elements of type TResult that
 * are obtained by performing an inner join on two sequences.
 */
function join(outer, inner, outerKeySelector, innerKeySelector, resultSelector, comparer = shared_1.StrictEqualityComparer) {
    async function* iterator() {
        const innerArray = [];
        for await (const i of inner) {
            innerArray.push(i);
        }
        for await (const o of outer) {
            const outerKey = outerKeySelector(o);
            for (const i of innerArray) {
                const innerKey = innerKeySelector(i);
                if (comparer(outerKey, innerKey) === true) {
                    yield resultSelector(o, i);
                }
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.join = join;


/***/ }),

/***/ 3700:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.last = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the last element of a sequence.
 * If predicate is specified, the last element of a sequence that satisfies a specified condition.
 * @param source An AsyncIterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The value at the last position in the source sequence
 * or the last element in the sequence that passes the test in the specified predicate function.
 */
async function last(source, predicate) {
    if (predicate) {
        return last2(source, predicate);
    }
    else {
        return last1(source);
    }
}
exports.last = last;
const last1 = async (source) => {
    let lastItem = null;
    for await (const value of source) {
        lastItem = value;
    }
    if (!lastItem) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return lastItem;
};
const last2 = async (source, predicate) => {
    let lastItem = null;
    for await (const value of source) {
        if (predicate(value) === true) {
            lastItem = value;
        }
    }
    if (!lastItem) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return lastItem;
};


/***/ }),

/***/ 7543:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the last element of a sequence that satisfies a specified condition.
 * @param source An AsyncIterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The last element in the sequence that passes the test in the specified predicate function.
 */
async function lastAsync(source, predicate) {
    let last = null;
    for await (const value of source) {
        if (await predicate(value) === true) {
            last = value;
        }
    }
    if (!last) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return last;
}
exports.lastAsync = lastAsync;


/***/ }),

/***/ 2424:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastOrDefault = void 0;
/**
 * Returns the last element of a sequence.
 * If predicate is specified, the last element of a sequence that satisfies a specified condition.
 * @param source An AsyncIterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The value at the last position in the source sequence
 * or the last element in the sequence that passes the test in the specified predicate function.
 */
async function lastOrDefault(source, predicate) {
    if (predicate) {
        return lastOrDefault2(source, predicate);
    }
    else {
        return lastOrDefault1(source);
    }
}
exports.lastOrDefault = lastOrDefault;
const lastOrDefault1 = async (source) => {
    let last = null;
    for await (const value of source) {
        last = value;
    }
    return last;
};
const lastOrDefault2 = async (source, predicate) => {
    let last = null;
    for await (const value of source) {
        if (predicate(value) === true) {
            last = value;
        }
    }
    return last;
};


/***/ }),

/***/ 2667:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastOrDefaultAsync = void 0;
/**
 * Returns the last element of a sequence that satisfies a specified condition.
 * @param source An AsyncIterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition.
 * @returns The last element in the sequence that passes the test in the specified predicate function.
 * Null if no elements.
 */
async function lastOrDefaultAsync(source, predicate) {
    let last = null;
    for await (const value of source) {
        if (await predicate(value) === true) {
            last = value;
        }
    }
    return last;
}
exports.lastOrDefaultAsync = lastOrDefaultAsync;


/***/ }),

/***/ 5338:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.max = void 0;
const shared_1 = __nccwpck_require__(5897);
function max(source, selector) {
    if (selector) {
        return max2(source, selector);
    }
    else {
        return max1(source);
    }
}
exports.max = max;
const max1 = async (source) => {
    let maxItem = null;
    for await (const item of source) {
        maxItem = Math.max(maxItem || Number.NEGATIVE_INFINITY, item);
    }
    if (maxItem === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return maxItem;
    }
};
const max2 = async (source, selector) => {
    let maxItem = null;
    for await (const item of source) {
        maxItem = Math.max(maxItem || Number.NEGATIVE_INFINITY, selector(item));
    }
    if (maxItem === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return maxItem;
    }
};


/***/ }),

/***/ 1705:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.maxAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Invokes an async transform function on each element of a sequence and returns the maximum value.
 * @param source A sequence of values to determine the maximum value of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The maximum value in the sequence.
 */
async function maxAsync(source, selector) {
    let max = null;
    for await (const item of source) {
        max = Math.max(max || Number.NEGATIVE_INFINITY, await selector(item));
    }
    if (max === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return max;
    }
}
exports.maxAsync = maxAsync;


/***/ }),

/***/ 2380:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.min = void 0;
const shared_1 = __nccwpck_require__(5897);
function min(source, selector) {
    if (selector) {
        return min2(source, selector);
    }
    else {
        return min1(source);
    }
}
exports.min = min;
const min1 = async (source) => {
    let minValue = null;
    for await (const item of source) {
        minValue = Math.min(minValue || Number.POSITIVE_INFINITY, item);
    }
    if (minValue === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return minValue;
    }
};
const min2 = async (source, selector) => {
    let minValue = null;
    for await (const item of source) {
        minValue = Math.min(minValue || Number.POSITIVE_INFINITY, selector(item));
    }
    if (minValue === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return minValue;
    }
};


/***/ }),

/***/ 4916:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.minAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Invokes a transform function on each element of a sequence and returns the minimum value.
 * @param source A sequence of values to determine the minimum value of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The minimum value in the sequence.
 */
async function minAsync(source, selector) {
    let min = null;
    for await (const item of source) {
        min = Math.min(min || Number.POSITIVE_INFINITY, await selector(item));
    }
    if (min === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return min;
    }
}
exports.minAsync = minAsync;


/***/ }),

/***/ 6592:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ofType = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Applies a type filter to a source iteration
 * @param source Async Iteration to Filtery by Type
 * @param type Either value for typeof or a consturctor function
 * @returns Values that match the type string or are instance of type
 */
function ofType(source, type) {
    const typeCheck = typeof type === "string" ?
        ((x) => typeof x === type) :
        ((x) => x instanceof type);
    async function* iterator() {
        for await (const item of source) {
            if (typeCheck(item)) {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.ofType = ofType;


/***/ }),

/***/ 1526:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderBy = void 0;
const OrderedAsyncEnumerable_1 = __nccwpck_require__(2485);
/**
 * Sorts the elements of a sequence in ascending order by using a specified or default comparer.
 * @param source A sequence of values to order.
 * @param keySelector A function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys. Optional.
 * @returns An IOrderedAsyncEnumerable<TElement> whose elements are sorted according to a key.
 */
function orderBy(source, keySelector, comparer) {
    return OrderedAsyncEnumerable_1.OrderedAsyncEnumerable.generate(source, keySelector, true, comparer);
}
exports.orderBy = orderBy;


/***/ }),

/***/ 4392:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByAsync = void 0;
const OrderedAsyncEnumerable_1 = __nccwpck_require__(2485);
/**
 * Sorts the elements of a sequence in ascending order by using a specified comparer.
 * @param source A sequence of values to order.
 * @param keySelector An async function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys.
 * @returns An IOrderedAsyncEnumerable<TElement> whose elements are sorted according to a key.
 */
function orderByAsync(source, keySelector, comparer) {
    return OrderedAsyncEnumerable_1.OrderedAsyncEnumerable.generateAsync(source, keySelector, true, comparer);
}
exports.orderByAsync = orderByAsync;


/***/ }),

/***/ 8610:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByDescending = void 0;
const OrderedAsyncEnumerable_1 = __nccwpck_require__(2485);
/**
 * Sorts the elements of a sequence in descending order by using a specified or default comparer.
 * @param source A sequence of values to order.
 * @param keySelector A function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys. Optional.
 * @returns An IOrderedAsyncEnumerable<TElement> whose elements are sorted in descending order according to a key.
 */
function orderByDescending(source, keySelector, comparer) {
    return OrderedAsyncEnumerable_1.OrderedAsyncEnumerable.generate(source, keySelector, false, comparer);
}
exports.orderByDescending = orderByDescending;


/***/ }),

/***/ 4310:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByDescendingAsync = void 0;
const OrderedAsyncEnumerable_1 = __nccwpck_require__(2485);
/**
 * Sorts the elements of an async sequence in descending order by using a specified comparer.
 * @param source A sequence of values to order.
 * @param keySelector An async function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys.
 * @returns An IOrderedAsyncEnumerable<TElement> whose elements are sorted in descending order according to a key.
 */
function orderByDescendingAsync(source, keySelector, comparer) {
    return OrderedAsyncEnumerable_1.OrderedAsyncEnumerable.generateAsync(source, keySelector, false, comparer);
}
exports.orderByDescendingAsync = orderByDescendingAsync;


/***/ }),

/***/ 9158:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reverse = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Inverts the order of the elements in a sequence.
 * @param source A sequence of values to reverse.
 * @returns A sequence whose elements correspond to those of the input sequence in reverse order.
 */
function reverse(source) {
    async function* iterator() {
        const values = [];
        for await (const value of source) {
            values.push(value);
        }
        for (let i = values.length - 1; i >= 0; i--) {
            yield values[i];
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.reverse = reverse;


/***/ }),

/***/ 4187:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.select = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function select(source, selector) {
    if (typeof selector === "function") {
        if (selector.length === 1) {
            return select1(source, selector);
        }
        else {
            return select2(source, selector);
        }
    }
    else {
        return select3(source, selector);
    }
}
exports.select = select;
const select1 = (source, selector) => {
    async function* iterator() {
        for await (const value of source) {
            yield selector(value);
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const select2 = (source, selector) => {
    async function* iterator() {
        let index = 0;
        for await (const value of source) {
            yield selector(value, index);
            index++;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const select3 = (source, key) => {
    async function* iterator() {
        for await (const value of source) {
            yield value[key];
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 8786:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function selectAsync(source, selector) {
    if (typeof selector === "string") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return selectAsync2(source, selector);
    }
    else {
        return selectAsync1(source, selector);
    }
}
exports.selectAsync = selectAsync;
const selectAsync1 = (source, selector) => {
    async function* iterator() {
        for await (const value of source) {
            yield selector(value);
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const selectAsync2 = (source, key) => {
    async function* iterator() {
        for await (const value of source) {
            yield value[key];
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 8624:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectMany = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function selectMany(source, selector) {
    if (typeof selector === "function") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (selector.length === 1) {
            return selectMany1(source, selector);
        }
        else {
            return selectMany2(source, selector);
        }
    }
    else {
        return selectMany3(source, selector);
    }
}
exports.selectMany = selectMany;
const selectMany1 = (source, selector) => {
    async function* iterator() {
        for await (const value of source) {
            for (const selectorValue of selector(value)) {
                yield selectorValue;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const selectMany2 = (source, selector) => {
    async function* iterator() {
        let index = 0;
        for await (const value of source) {
            for (const selectorValue of selector(value, index)) {
                yield selectorValue;
            }
            index++;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const selectMany3 = (source, selector) => {
    async function* iterator() {
        for await (const value of source) {
            for (const selectorValue of value[selector]) {
                yield selectorValue;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 2627:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectManyAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Projects each element of a sequence to an IAsyncEnumerable<T> and flattens the resulting sequences into one sequence.
 * @param source A sequence of values to project.
 * @param selector A transform function to apply to each element.
 * @returns An IAsyncEnumerable<T> whose elements are the result of invoking the
 * one-to-many transform function on each element of the input sequence.
 */
function selectManyAsync(source, selector) {
    if (selector.length === 1) {
        const iterator = async function* () {
            for await (const value of source) {
                const many = await selector(value);
                for (const innerValue of many) {
                    yield innerValue;
                }
            }
        };
        return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
    }
    else {
        const iterator = async function* () {
            let index = 0;
            for await (const value of source) {
                const many = await selector(value, index);
                for (const innerValue of many) {
                    yield innerValue;
                }
                index++;
            }
        };
        return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
    }
}
exports.selectManyAsync = selectManyAsync;


/***/ }),

/***/ 7058:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sequenceEquals = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Compares two async iterations to see if they are equal using a comparer function.
 * @param first First Sequence
 * @param second Second Sequence
 * @param comparer Comparer
 * @returns Whether or not the two iterations are equal
 */
async function sequenceEquals(first, second, comparer = shared_1.StrictEqualityComparer) {
    const firstIterator = first[Symbol.asyncIterator]();
    const secondIterator = second[Symbol.asyncIterator]();
    let results = await Promise.all([firstIterator.next(), secondIterator.next()]);
    let firstResult = results[0];
    let secondResult = results[1];
    while (!firstResult.done && !secondResult.done) {
        if (!comparer(firstResult.value, secondResult.value)) {
            return false;
        }
        results = await Promise.all([firstIterator.next(), secondIterator.next()]);
        firstResult = results[0];
        secondResult = results[1];
    }
    return firstResult.done === true && secondResult.done === true;
}
exports.sequenceEquals = sequenceEquals;


/***/ }),

/***/ 8488:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sequenceEqualsAsync = void 0;
/**
 * Compares two async iterables to see if they are equal using a async comparer function.
 * @param first First Sequence
 * @param second Second Sequence
 * @param comparer Async Comparer
 * @returns Whether or not the two iterations are equal
 */
async function sequenceEqualsAsync(first, second, comparer) {
    const firstIterator = first[Symbol.asyncIterator]();
    const secondIterator = second[Symbol.asyncIterator]();
    let results = await Promise.all([firstIterator.next(), secondIterator.next()]);
    let firstResult = results[0];
    let secondResult = results[1];
    while (!firstResult.done && !secondResult.done) {
        if (await comparer(firstResult.value, secondResult.value) === false) {
            return false;
        }
        results = await Promise.all([firstIterator.next(), secondIterator.next()]);
        firstResult = results[0];
        secondResult = results[1];
    }
    return firstResult.done === true && secondResult.done === true;
}
exports.sequenceEqualsAsync = sequenceEqualsAsync;


/***/ }),

/***/ 1430:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.single = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the only element of a sequence that satisfies a specified condition (if specified),
 * and throws an exception if more than one such element exists.
 * @param source An AsyncIterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. (Optional)
 * @throws {InvalidOperationException} No element satisfies the condition in predicate. OR
 * More than one element satisfies the condition in predicate. OR
 * The source sequence is empty.
 * @returns The single element of the input sequence that satisfies a condition.
 */
function single(source, predicate) {
    if (predicate) {
        return single2(source, predicate);
    }
    else {
        return single1(source);
    }
}
exports.single = single;
const single1 = async (source) => {
    let hasValue = false;
    let singleValue = null;
    for await (const value of source) {
        if (hasValue === true) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
        }
        else {
            hasValue = true;
            singleValue = value;
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return singleValue;
};
const single2 = async (source, predicate) => {
    let hasValue = false;
    let singleValue = null;
    for await (const value of source) {
        if (predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return singleValue;
};


/***/ }),

/***/ 4572:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the only element of a sequence that satisfies a specified condition,
 * and throws an exception if more than one such element exists.
 * @param source An AsyncIterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition.
 * @throws {InvalidOperationException}
 * No element satisfies the condition in predicate. OR
 * More than one element satisfies the condition in predicate. OR
 * The source sequence is empty.
 * @returns The single element of the input sequence that satisfies a condition.
 */
async function singleAsync(source, predicate) {
    let hasValue = false;
    let singleValue = null;
    for await (const value of source) {
        if (await predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return singleValue;
}
exports.singleAsync = singleAsync;


/***/ }),

/***/ 5053:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleOrDefault = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * If predicate is specified returns the only element of a sequence that satisfies a specified condition,
 * ootherwise returns the only element of a sequence. Returns a default value if no such element exists.
 * @param source An AsyncIterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. Optional.
 * @throws {InvalidOperationException}
 * If predicate is specified more than one element satisfies the condition in predicate,
 * otherwise the input sequence contains more than one element.
 * @returns The single element of the input sequence that satisfies the condition,
 * or null if no such element is found.
 */
function singleOrDefault(source, predicate) {
    if (predicate) {
        return singleOrDefault2(source, predicate);
    }
    else {
        return singleOrDefault1(source);
    }
}
exports.singleOrDefault = singleOrDefault;
const singleOrDefault1 = async (source) => {
    let hasValue = false;
    let singleValue = null;
    for await (const value of source) {
        if (hasValue === true) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
        }
        else {
            hasValue = true;
            singleValue = value;
        }
    }
    return singleValue;
};
const singleOrDefault2 = async (source, predicate) => {
    let hasValue = false;
    let singleValue = null;
    for await (const value of source) {
        if (predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    return singleValue;
};


/***/ }),

/***/ 6031:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleOrDefaultAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the only element of a sequence that satisfies a specified condition.
 * Returns a default value if no such element exists.
 * @param source An AsyncIterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. Optional.
 * @throws {InvalidOperationException}
 * If predicate is specified more than one element satisfies the condition in predicate,
 * otherwise the input sequence contains more than one element.
 * @returns The single element of the input sequence that satisfies the condition,
 * or null if no such element is found.
 */
async function singleOrDefaultAsync(source, predicate) {
    let hasValue = false;
    let singleValue = null;
    for await (const value of source) {
        if (await predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    return singleValue;
}
exports.singleOrDefaultAsync = singleOrDefaultAsync;


/***/ }),

/***/ 4114:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skip = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
 * @param source An AsyncIterable<T> to return elements from.
 * @param count The number of elements to skip before returning the remaining elements.
 * @returns
 * An IAsyncEnumerable<T> that contains the elements that occur after the specified index in the input sequence.
 */
function skip(source, count) {
    async function* iterator() {
        let i = 0;
        for await (const item of source) {
            if (i++ >= count) {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.skip = skip;


/***/ }),

/***/ 5477:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skipWhile = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
 * The element's index is used in the logic of the predicate function.
 * @param source An AsyncIterable<T> to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains the elements from the input sequence starting at the first element
 * in the linear series that does not pass the test specified by predicate.
 */
function skipWhile(source, predicate) {
    if (predicate.length === 1) {
        return skipWhile1(source, predicate);
    }
    else {
        return skipWhile2(source, predicate);
    }
}
exports.skipWhile = skipWhile;
const skipWhile1 = (source, predicate) => {
    async function* iterator() {
        let skip = true;
        for await (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (predicate(item) === false) {
                skip = false;
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const skipWhile2 = (source, predicate) => {
    async function* iterator() {
        let index = 0;
        let skip = true;
        for await (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (predicate(item, index) === false) {
                skip = false;
                yield item;
            }
            index++;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 5706:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skipWhileAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
 * The element's index is used in the logic of the predicate function.
 * @param source An AsyncIterable<T> to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains the elements from the input sequence starting
 * at the first element in the linear series that does not pass the test specified by predicate.
 */
function skipWhileAsync(source, predicate) {
    if (predicate.length === 1) {
        return skipWhileAsync1(source, predicate);
    }
    else {
        return skipWhileAsync2(source, predicate);
    }
}
exports.skipWhileAsync = skipWhileAsync;
const skipWhileAsync1 = (source, predicate) => {
    async function* iterator() {
        let skip = true;
        for await (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (await predicate(item) === false) {
                skip = false;
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const skipWhileAsync2 = (source, predicate) => {
    async function* iterator() {
        let index = 0;
        let skip = true;
        for await (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (await predicate(item, index) === false) {
                skip = false;
                yield item;
            }
            index++;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 9890:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sum = void 0;
function sum(source, selector) {
    if (selector) {
        return sum2(source, selector);
    }
    else {
        return sum1(source);
    }
}
exports.sum = sum;
const sum1 = async (source) => {
    let total = 0;
    for await (const value of source) {
        total += value;
    }
    return total;
};
const sum2 = async (source, selector) => {
    let total = 0;
    for await (const value of source) {
        total += selector(value);
    }
    return total;
};


/***/ }),

/***/ 7237:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sumAsync = void 0;
/**
 * Computes the sum of the sequence of numeric values that are obtained by invoking a transform function
 * on each element of the input async sequence.
 * @param source A sequence of values that are used to calculate a sum.
 * @param selector A transform function to apply to each element.
 * @returns The sum of values (from the selector) of the async sequence
 */
exports.sumAsync = async (source, selector) => {
    let sum = 0;
    for await (const value of source) {
        sum += await selector(value);
    }
    return sum;
};


/***/ }),

/***/ 8143:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.take = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Returns a specified number of contiguous elements from the start of a sequence.
 * @param source The sequence to return elements from.
 * @param amount The number of elements to return.
 * @returns An IAsyncEnumerable<T> that contains the specified number of elements from the start of the input sequence.
 */
function take(source, amount) {
    async function* iterator() {
        // negative amounts should yield empty
        let amountLeft = amount > 0 ? amount : 0;
        for await (const item of source) {
            if (amountLeft-- === 0) {
                break;
            }
            else {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.take = take;


/***/ }),

/***/ 9458:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.takeWhile = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Returns elements from a sequence as long as a specified condition is true.
 * The element's index is used in the logic of the predicate function.
 * @param source The sequence to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence
 * that occur before the element at which the test no longer passes.
 */
exports.takeWhile = (source, predicate) => {
    if (predicate.length === 1) {
        return takeWhile1(source, predicate);
    }
    else {
        return takeWhile2(source, predicate);
    }
};
const takeWhile1 = (source, predicate) => {
    async function* iterator() {
        for await (const item of source) {
            if (predicate(item)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const takeWhile2 = (source, predicate) => {
    async function* iterator() {
        let index = 0;
        for await (const item of source) {
            if (predicate(item, index++)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 9247:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.takeWhileAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Returns elements from a sequence as long as a specified condition is true.
 * The element's index is used in the logic of the predicate function.
 * @param source The sequence to return elements from.
 * @param predicate A async function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence
 * that occur before the element at which the test no longer passes.
 */
function takeWhileAsync(source, predicate) {
    if (predicate.length === 1) {
        return takeWhileAsync1(source, predicate);
    }
    else {
        return takeWhileAsync2(source, predicate);
    }
}
exports.takeWhileAsync = takeWhileAsync;
const takeWhileAsync1 = (source, predicate) => {
    async function* iterator() {
        for await (const item of source) {
            if (await predicate(item)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const takeWhileAsync2 = (source, predicate) => {
    async function* iterator() {
        let index = 0;
        for await (const item of source) {
            if (await predicate(item, index++)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 5029:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toArray = void 0;
/**
 * Creates an array from a AsyncIterable<T>.
 * @param source An AsyncIterable<T> to create an array from.
 * @returns An array of elements
 */
async function toArray(source) {
    const array = [];
    for await (const item of source) {
        array.push(item);
    }
    return array;
}
exports.toArray = toArray;


/***/ }),

/***/ 7060:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toMap = void 0;
/**
 * Converts an AsyncIterable<V> to a Map<K, V[]>.
 * @param source An Iterable<V> to convert.
 * @param selector A function to serve as a key selector.
 * @returns A promise for Map<K, V[]>
 */
async function toMap(source, selector) {
    const map = new Map();
    for await (const value of source) {
        const key = selector(value);
        const array = map.get(key);
        if (array === undefined) {
            map.set(key, [value]);
        }
        else {
            array.push(value);
        }
    }
    return map;
}
exports.toMap = toMap;


/***/ }),

/***/ 8649:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toMapAsync = void 0;
/**
 * Converts an AsyncIterable<V> to a Map<K, V[]>.
 * @param source An Iterable<V> to convert.
 * @param selector An async function to serve as a key selector.
 * @returns A promise for Map<K, V[]>
 */
async function toMapAsync(source, selector) {
    const map = new Map();
    for await (const value of source) {
        const key = await selector(value);
        const array = map.get(key);
        if (array === undefined) {
            map.set(key, [value]);
        }
        else {
            array.push(value);
        }
    }
    return map;
}
exports.toMapAsync = toMapAsync;


/***/ }),

/***/ 4145:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toSet = void 0;
/**
 * Converts the Async Itertion to a Set
 * @param source Iteration
 * @returns Set containing the iteration values
 */
async function toSet(source) {
    const set = new Set();
    for await (const item of source) {
        set.add(item);
    }
    return set;
}
exports.toSet = toSet;


/***/ }),

/***/ 3410:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.union = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Produces the set union of two sequences by using scrict equality comparison or a specified IEqualityComparer<T>.
 * @param first An AsyncIterable<T> whose distinct elements form the first set for the union.
 * @param second An AsyncIterable<T> whose distinct elements form the second set for the union.
 * @param comparer The IEqualityComparer<T> to compare values. Optional.
 * @returns An IAsyncEnumerable<T> that contains the elements from both input sequences, excluding duplicates.
 */
function union(first, second, comparer) {
    if (comparer) {
        return union2(first, second, comparer);
    }
    else {
        return union1(first, second);
    }
}
exports.union = union;
const union1 = (first, second) => {
    async function* iterator() {
        const set = new Set();
        for await (const item of first) {
            if (set.has(item) === false) {
                yield item;
                set.add(item);
            }
        }
        for await (const item of second) {
            if (set.has(item) === false) {
                yield item;
                set.add(item);
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const union2 = (first, second, comparer) => {
    async function* iterator() {
        const result = [];
        for (const source of [first, second]) {
            for await (const value of source) {
                let exists = false;
                for (const resultValue of result) {
                    if (comparer(value, resultValue) === true) {
                        exists = true;
                        break;
                    }
                }
                if (exists === false) {
                    yield value;
                    result.push(value);
                }
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 9953:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unionAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Produces the set union of two sequences by using a specified IAsyncEqualityComparer<T>.
 * @param first An AsyncIterable<T> whose distinct elements form the first set for the union.
 * @param second An AsyncIterable<T> whose distinct elements form the second set for the union.
 * @param comparer The IAsyncEqualityComparer<T> to compare values.
 * @returns An IAsyncEnumerable<T> that contains the elements from both input sequences, excluding duplicates.
 */
function unionAsync(first, second, comparer) {
    async function* iterator() {
        const result = [];
        for (const source of [first, second]) {
            for await (const value of source) {
                let exists = false;
                for (const resultValue of result) {
                    if (await comparer(value, resultValue) === true) {
                        exists = true;
                        break;
                    }
                }
                if (exists === false) {
                    yield value;
                    result.push(value);
                }
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.unionAsync = unionAsync;


/***/ }),

/***/ 9156:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.where = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Filters a sequence of values based on a predicate.
 * Each element's index is used in the logic of the predicate function.
 * @param source An AsyncIterable<T> to filter.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence that satisfy the condition.
 */
function where(source, predicate) {
    if (predicate.length === 1) {
        return where1(source, predicate);
    }
    else {
        return where2(source, predicate);
    }
}
exports.where = where;
const where1 = (source, predicate) => {
    async function* iterator() {
        for await (const item of source) {
            if (predicate(item) === true) {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const where2 = (source, predicate) => {
    async function* iterator() {
        let i = 0;
        for await (const item of source) {
            if (predicate(item, i++) === true) {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 377:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.whereAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Filters a sequence of values based on a predicate.
 * Each element's index is used in the logic of the predicate function.
 * @param source An AsyncIterable<T> to filter.
 * @param predicate A async function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence that satisfy the condition.
 */
function whereAsync(source, predicate) {
    if (predicate.length === 1) {
        return whereAsync1(source, predicate);
    }
    else {
        return whereAsync2(source, predicate);
    }
}
exports.whereAsync = whereAsync;
const whereAsync1 = (source, predicate) => {
    async function* iterator() {
        for await (const item of source) {
            if (await predicate(item) === true) {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const whereAsync2 = (source, predicate) => {
    async function* iterator() {
        let i = 0;
        for await (const item of source) {
            if (await predicate(item, i++) === true) {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 4440:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.zip = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function zip(first, second, resultSelector) {
    if (resultSelector) {
        return zip2(first, second, resultSelector);
    }
    else {
        return zip1(first, second);
    }
}
exports.zip = zip;
const zip1 = (source, second) => {
    async function* iterator() {
        const firstIterator = source[Symbol.asyncIterator]();
        const secondIterator = second[Symbol.asyncIterator]();
        while (true) {
            const result = await Promise.all([firstIterator.next(), secondIterator.next()]);
            const a = result[0];
            const b = result[1];
            if (a.done && b.done) {
                break;
            }
            else {
                yield [a.value, b.value];
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
const zip2 = (source, second, resultSelector) => {
    async function* iterator() {
        const firstIterator = source[Symbol.asyncIterator]();
        const secondIterator = second[Symbol.asyncIterator]();
        while (true) {
            const result = await Promise.all([firstIterator.next(), secondIterator.next()]);
            const a = result[0];
            const b = result[1];
            if (a.done && b.done) {
                break;
            }
            else {
                yield resultSelector(a.value, b.value);
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 9774:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.zipAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Applies a specified async function to the corresponding elements of two sequences,
 * producing a sequence of the results.
 * @param first The first sequence to merge.
 * @param second The second sequence to merge.
 * @param resultSelector An async function that specifies how to merge the elements from the two sequences.
 * @returns An IAsyncEnumerable<T> that contains merged elements of two input sequences.
 */
function zipAsync(first, second, resultSelector) {
    async function* generator() {
        const firstIterator = first[Symbol.asyncIterator]();
        const secondIterator = second[Symbol.asyncIterator]();
        while (true) {
            const results = await Promise.all([firstIterator.next(), secondIterator.next()]);
            const firstNext = results[0];
            const secondNext = results[1];
            if (firstNext.done || secondNext.done) {
                break;
            }
            else {
                yield resultSelector(firstNext.value, secondNext.value);
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(generator);
}
exports.zipAsync = zipAsync;


/***/ }),

/***/ 7718:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isAsyncEnumerable = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * Determine if a type is IAsyncEnumerable
 * @param source Any Value
 * @returns Whether or not source is an Async Enumerable
 */
function isAsyncEnumerable(source) {
    if (!source) {
        return false;
    }
    if (source instanceof BasicAsyncEnumerable_1.BasicAsyncEnumerable) {
        return true;
    }
    if (typeof source[Symbol.asyncIterator] !== "function") {
        return false;
    }
    const propertyNames = Object.getOwnPropertyNames(BasicAsyncEnumerable_1.BasicAsyncEnumerable.prototype)
        .filter((v) => v !== "constructor");
    const methods = source.prototype || source;
    for (const prop of propertyNames) {
        if (typeof methods[prop] !== "function") {
            return false;
        }
    }
    return true;
}
exports.isAsyncEnumerable = isAsyncEnumerable;


/***/ }),

/***/ 2544:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.emptyAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Returns an empty IAsyncEnumerable<T> that has the specified type argument.
 * @returns An empty IAsyncEnumerable<T> whose type argument is TResult.
 */
exports.emptyAsync = () => {
    async function* iterable() {
        for await (const _ of []) {
            yield _;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterable);
};


/***/ }),

/***/ 2753:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.enumerateObjectAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Iterates through the object
 * @param source Source Object
 * @returns IAsyncEnumerabe<[TKey, TValue]> of Key Value pairs
 */
exports.enumerateObjectAsync = (source) => {
    async function* iterable() {
        /* eslint-disable */
        for (const key in source) {
            yield [key, source[key]];
        }
        /* eslint-enable */
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterable);
};


/***/ }),

/***/ 1712:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.flattenAsync = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function flattenAsync(source, shallow) {
    async function* iterator(sourceInner) {
        for await (const item of sourceInner) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (item[Symbol.asyncIterator] !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const items = shallow ? item : iterator(item);
                for await (const inner of items) {
                    yield inner;
                }
            }
            else {
                yield item;
            }
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(() => iterator(source));
}
exports.flattenAsync = flattenAsync;


/***/ }),

/***/ 5641:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fromAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
function fromAsync(promisesOrIterable) {
    if (Array.isArray(promisesOrIterable)) {
        if (promisesOrIterable.length === 0) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
        }
        return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(async function* () {
            for await (const value of promisesOrIterable) {
                yield value;
            }
        });
    }
    else {
        return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(promisesOrIterable);
    }
}
exports.fromAsync = fromAsync;


/***/ }),

/***/ 8272:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var emptyAsync_1 = __nccwpck_require__(2544);
Object.defineProperty(exports, "emptyAsync", ({ enumerable: true, get: function () { return emptyAsync_1.emptyAsync; } }));
var enumerateObjectAsync_1 = __nccwpck_require__(2753);
Object.defineProperty(exports, "enumerateObjectAsync", ({ enumerable: true, get: function () { return enumerateObjectAsync_1.enumerateObjectAsync; } }));
var flattenAsync_1 = __nccwpck_require__(1712);
Object.defineProperty(exports, "flattenAsync", ({ enumerable: true, get: function () { return flattenAsync_1.flattenAsync; } }));
var fromAsync_1 = __nccwpck_require__(5641);
Object.defineProperty(exports, "fromAsync", ({ enumerable: true, get: function () { return fromAsync_1.fromAsync; } }));
var partitionAsync_1 = __nccwpck_require__(3482);
Object.defineProperty(exports, "partitionAsync", ({ enumerable: true, get: function () { return partitionAsync_1.partitionAsync; } }));
var rangeAsync_1 = __nccwpck_require__(5948);
Object.defineProperty(exports, "rangeAsync", ({ enumerable: true, get: function () { return rangeAsync_1.rangeAsync; } }));
var repeatAsync_1 = __nccwpck_require__(7393);
Object.defineProperty(exports, "repeatAsync", ({ enumerable: true, get: function () { return repeatAsync_1.repeatAsync; } }));


/***/ }),

/***/ 3482:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.partitionAsync = void 0;
/**
 * Paritions the Iterable<T> into a tuple of failing and passing arrays
 * based on the predicate.
 * @param source Elements to Partition
 * @param predicate Pass / Fail condition
 * @returns [pass, fail]
 */
exports.partitionAsync = async (source, predicate) => {
    const fail = [];
    const pass = [];
    for await (const value of source) {
        if (predicate(value) === true) {
            pass.push(value);
        }
        else {
            fail.push(value);
        }
    }
    return [pass, fail];
};


/***/ }),

/***/ 5948:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.rangeAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Generates a sequence of integral numbers within a specified range.
 * @param start The value of the first integer in the sequence.
 * @param count The number of sequential integers to generate.
 * @throws {ArgumentOutOfRangeException} Start is Less than 0
 * OR start + count -1 is larger than MAX_SAFE_INTEGER.
 * @returns An IAsyncEnumerable<number> that contains a range of sequential integral numbers.
 */
function rangeAsync(start, count) {
    if (start < 0 || (start + count - 1) > Number.MAX_SAFE_INTEGER) {
        throw new shared_1.ArgumentOutOfRangeException(`start`);
    }
    async function* iterator() {
        const max = start + count;
        for (let i = start; i < max; i++) {
            yield i;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
}
exports.rangeAsync = rangeAsync;


/***/ }),

/***/ 7393:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.repeatAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
/**
 * Generates a sequence that contains one repeated value.
 * @param element The value to be repeated.
 * @param count The number of times to repeat the value in the generated sequence.
 * @param delay How long to delay the repeat (ms)
 * @returns An IAsyncEnumerable<T> that contains a repeated value.
 */
function repeatAsync(element, count, delay) {
    if (count < 0) {
        throw new shared_1.ArgumentOutOfRangeException(`count`);
    }
    if (delay) {
        return repeat2(element, count, delay);
    }
    else {
        return repeat1(element, count);
    }
}
exports.repeatAsync = repeatAsync;
/**
 * @private
 */
const repeat1 = (element, count) => {
    async function* iterator() {
        for (let i = 0; i < count; i++) {
            yield element;
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};
/**
 * @private
 */
const repeat2 = (element, count, delay) => {
    async function* iterator() {
        for (let i = 0; i < count; i++) {
            yield await new Promise((resolve) => setTimeout(() => resolve(element), delay));
        }
    }
    return new BasicAsyncEnumerable_1.BasicAsyncEnumerable(iterator);
};


/***/ }),

/***/ 9657:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

// LINQ to TypeScript
// Copyright (c) Alexandre Rogozine
// MIT License
// https://github.com/arogozine/LinqToTypeScript/blob/master/LICENSE
Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __nccwpck_require__(4351);
// API design adapted from,
// LINQ: .NET Language-Integrated Query
// API is part of .NET Core foundational libraries (CoreFX)
// MIT License
// https://github.com/dotnet/corefx/blob/master/LICENSE.TXT
// API Documentation adapted from,
// LINQ API Documentation
// Create Commons Attribution 4.0 International
// https://github.com/dotnet/docs/blob/master/LICENSE
// Shared Interfacess
tslib_1.__exportStar(__nccwpck_require__(9581), exports);
// Types and Stuff
tslib_1.__exportStar(__nccwpck_require__(5897), exports);
var ArrayEnumerable_1 = __nccwpck_require__(8640);
Object.defineProperty(exports, "ArrayEnumerable", ({ enumerable: true, get: function () { return ArrayEnumerable_1.ArrayEnumerable; } }));
// Main Initializer
tslib_1.__exportStar(__nccwpck_require__(8593), exports);
// Static Methods
tslib_1.__exportStar(__nccwpck_require__(2374), exports);
tslib_1.__exportStar(__nccwpck_require__(8272), exports);
tslib_1.__exportStar(__nccwpck_require__(8485), exports);
// Type Check
var isEnumerable_1 = __nccwpck_require__(8120);
Object.defineProperty(exports, "isEnumerable", ({ enumerable: true, get: function () { return isEnumerable_1.isEnumerable; } }));
var isParallelEnumerable_1 = __nccwpck_require__(9475);
Object.defineProperty(exports, "isParallelEnumerable", ({ enumerable: true, get: function () { return isParallelEnumerable_1.isParallelEnumerable; } }));
var isAsyncEnumerable_1 = __nccwpck_require__(7718);
Object.defineProperty(exports, "isAsyncEnumerable", ({ enumerable: true, get: function () { return isAsyncEnumerable_1.isAsyncEnumerable; } }));


/***/ }),

/***/ 973:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindArray = void 0;
const ArrayEnumerable_1 = __nccwpck_require__(8640);
/**
 * Binds LINQ method to a built in array type
 * @param jsArray Built In JS Array Type
 */
exports.bindArray = (jsArray) => {
    const propertyNames = Object.getOwnPropertyNames(ArrayEnumerable_1.ArrayEnumerable.prototype)
        // eslint-disable-next-line @typescript-eslint/array-type
        .filter((v) => v !== "constructor");
    for (const prop of propertyNames) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        jsArray.prototype[prop] = jsArray.prototype[prop] || ArrayEnumerable_1.ArrayEnumerable.prototype[prop];
    }
};


/***/ }),

/***/ 3091:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindArrayEnumerable = void 0;
const shared_1 = __nccwpck_require__(5897);
const ArrayEnumerable_1 = __nccwpck_require__(8640);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * @private
 */
exports.bindArrayEnumerable = () => {
    const { prototype } = ArrayEnumerable_1.ArrayEnumerable;
    const propertyNames = Object.getOwnPropertyNames(BasicEnumerable_1.BasicEnumerable.prototype)
        // eslint-disable-next-line @typescript-eslint/array-type
        .filter((v) => v !== "constructor");
    for (const prop of propertyNames) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        prototype[prop] = prototype[prop] || BasicEnumerable_1.BasicEnumerable.prototype[prop];
    }
    prototype.all = function (predicate) {
        return this.every(predicate);
    };
    prototype.any = function (predicate) {
        if (predicate) {
            return this.some(predicate);
        }
        else {
            return this.length !== 0;
        }
    };
    prototype.count = function (predicate) {
        if (predicate) {
            // eslint-disable-next-line no-shadow
            let count = 0;
            for (let i = 0; i < this.length; i++) {
                if (predicate(this[i]) === true) {
                    count++;
                }
            }
            return count;
        }
        else {
            return this.length;
        }
    };
    prototype.elementAt = function (index) {
        if (index < 0 || index >= this.length) {
            throw new shared_1.ArgumentOutOfRangeException("index");
        }
        return this[index];
    };
    prototype.elementAtOrDefault = function (index) {
        return this[index] || null;
    };
    prototype.first = function (predicate) {
        if (predicate) {
            const value = this.find(predicate);
            if (value === undefined) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
            }
            else {
                return value;
            }
        }
        else {
            if (this.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            return this[0];
        }
    };
    prototype.firstOrDefault = function (predicate) {
        if (predicate) {
            const value = this.find(predicate);
            if (value === undefined) {
                return null;
            }
            else {
                return value;
            }
        }
        else {
            return this.length === 0 ? null : this[0];
        }
    };
    prototype.last = function (predicate) {
        if (predicate) {
            for (let i = this.length - 1; i >= 0; i--) {
                const value = this[i];
                if (predicate(value) === true) {
                    return value;
                }
            }
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
        }
        else {
            if (this.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            return this[this.length - 1];
        }
    };
    prototype.lastOrDefault = function (predicate) {
        if (predicate) {
            for (let i = this.length - 1; i >= 0; i--) {
                const value = this[i];
                if (predicate(value) === true) {
                    return value;
                }
            }
            return null;
        }
        else {
            return this.length === 0 ? null : this[this.length - 1];
        }
    };
    prototype.max = function (selector) {
        if (this.length === 0) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
        }
        if (selector) {
            // eslint-disable-next-line no-shadow
            let max = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < this.length; i++) {
                max = Math.max(selector(this[i]), max);
            }
            return max;
        }
        else {
            return Math.max.apply(null, this);
        }
    };
    prototype.min = function (selector) {
        if (this.length === 0) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
        }
        if (selector) {
            // eslint-disable-next-line no-shadow
            let min = Number.POSITIVE_INFINITY;
            for (let i = 0; i < this.length; i++) {
                min = Math.min(selector(this[i]), min);
            }
            return min;
        }
        else {
            return Math.min.apply(null, this);
        }
    };
    prototype.reverse = function () {
        Array.prototype.reverse.apply(this);
        return this;
    };
};


/***/ }),

/***/ 6802:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindLinq = void 0;
const aggregate_1 = __nccwpck_require__(3880);
const all_1 = __nccwpck_require__(6504);
const allAsync_1 = __nccwpck_require__(7664);
const any_1 = __nccwpck_require__(6666);
const anyAsync_1 = __nccwpck_require__(7462);
const asAsync_1 = __nccwpck_require__(7662);
const asParallel_1 = __nccwpck_require__(2035);
const average_1 = __nccwpck_require__(758);
const averageAsync_1 = __nccwpck_require__(9013);
const concatenate_1 = __nccwpck_require__(323);
const contains_1 = __nccwpck_require__(6805);
const containsAsync_1 = __nccwpck_require__(8261);
const count_1 = __nccwpck_require__(6333);
const countAsync_1 = __nccwpck_require__(7872);
const distinct_1 = __nccwpck_require__(5605);
const distinctAsync_1 = __nccwpck_require__(4770);
const each_1 = __nccwpck_require__(679);
const eachAsync_1 = __nccwpck_require__(6256);
const elementAt_1 = __nccwpck_require__(3281);
const elementAtOrDefault_1 = __nccwpck_require__(6643);
const except_1 = __nccwpck_require__(1213);
const exceptAsync_1 = __nccwpck_require__(202);
const first_1 = __nccwpck_require__(3633);
const firstAsync_1 = __nccwpck_require__(6717);
const firstOrDefault_1 = __nccwpck_require__(1250);
const firstOrDefaultAsync_1 = __nccwpck_require__(5559);
const groupBy_1 = __nccwpck_require__(7267);
const groupByAsync_1 = __nccwpck_require__(2697);
const groupByWithSel_1 = __nccwpck_require__(1647);
const intersect_1 = __nccwpck_require__(1400);
const intersectAsync_1 = __nccwpck_require__(6380);
const join_1 = __nccwpck_require__(5095);
const last_1 = __nccwpck_require__(7768);
const lastAsync_1 = __nccwpck_require__(7040);
const lastOrDefault_1 = __nccwpck_require__(9490);
const lastOrDefaultAsync_1 = __nccwpck_require__(4899);
const max_1 = __nccwpck_require__(6526);
const maxAsync_1 = __nccwpck_require__(485);
const min_1 = __nccwpck_require__(31);
const minAsync_1 = __nccwpck_require__(5475);
const ofType_1 = __nccwpck_require__(1334);
const orderBy_1 = __nccwpck_require__(123);
const orderByAsync_1 = __nccwpck_require__(5293);
const orderByDescending_1 = __nccwpck_require__(1098);
const orderByDescendingAsync_1 = __nccwpck_require__(9594);
const reverse_1 = __nccwpck_require__(5631);
const select_1 = __nccwpck_require__(2998);
const selectAsync_1 = __nccwpck_require__(9362);
const selectMany_1 = __nccwpck_require__(9430);
const selectManyAsync_1 = __nccwpck_require__(3796);
const sequenceEquals_1 = __nccwpck_require__(1748);
const sequenceEqualsAsync_1 = __nccwpck_require__(6249);
const single_1 = __nccwpck_require__(4579);
const singleAsync_1 = __nccwpck_require__(1488);
const singleOrDefault_1 = __nccwpck_require__(4811);
const singleOrDefaultAsync_1 = __nccwpck_require__(6250);
const skip_1 = __nccwpck_require__(1504);
const skipWhile_1 = __nccwpck_require__(9517);
const skipWhileAsync_1 = __nccwpck_require__(7112);
const sum_1 = __nccwpck_require__(4747);
const sumAsync_1 = __nccwpck_require__(5914);
const take_1 = __nccwpck_require__(7429);
const takeWhile_1 = __nccwpck_require__(3875);
const takeWhileAsync_1 = __nccwpck_require__(4277);
const toArray_1 = __nccwpck_require__(7708);
const toMap_1 = __nccwpck_require__(5036);
const toMapAsync_1 = __nccwpck_require__(2124);
const toSet_1 = __nccwpck_require__(4469);
const union_1 = __nccwpck_require__(3396);
const unionAsync_1 = __nccwpck_require__(5489);
const where_1 = __nccwpck_require__(2745);
const whereAsync_1 = __nccwpck_require__(2971);
const zip_1 = __nccwpck_require__(4172);
const zipAsync_1 = __nccwpck_require__(3202);
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
/**
 * Binds LINQ methods to an iterable type
 * @param object Iterable Type
 */
exports.bindLinq = (object) => {
    const prototype = object.prototype;
    // The static methods take an IEnumerable as first argument
    // when wrapping the first argument becomes `this`
    const bind = (func, key) => {
        const wrapped = function (...params) {
            return func(this, ...params);
        };
        Object.defineProperty(wrapped, "length", { value: func.length - 1 });
        prototype[key] = wrapped;
    };
    bind(aggregate_1.aggregate, "aggregate");
    bind(all_1.all, "all");
    bind(allAsync_1.allAsync, "allAsync");
    bind(any_1.any, "any");
    bind(anyAsync_1.anyAsync, "anyAsync");
    bind(asAsync_1.asAsync, "asAsync");
    bind(asParallel_1.asParallel, "asParallel");
    bind(average_1.average, "average");
    bind(averageAsync_1.averageAsync, "averageAsync");
    bind(concatenate_1.concatenate, "concatenate");
    bind(contains_1.contains, "contains");
    bind(containsAsync_1.containsAsync, "containsAsync");
    bind(count_1.count, "count");
    bind(countAsync_1.countAsync, "countAsync");
    bind(distinct_1.distinct, "distinct");
    bind(distinctAsync_1.distinctAsync, "distinctAsync");
    bind(each_1.each, "each");
    bind(eachAsync_1.eachAsync, "eachAsync");
    bind(elementAt_1.elementAt, "elementAt");
    bind(elementAtOrDefault_1.elementAtOrDefault, "elementAtOrDefault");
    bind(except_1.except, "except");
    bind(exceptAsync_1.exceptAsync, "exceptAsync");
    bind(first_1.first, "first");
    bind(firstAsync_1.firstAsync, "firstAsync");
    bind(firstOrDefault_1.firstOrDefault, "firstOrDefault");
    bind(firstOrDefaultAsync_1.firstOrDefaultAsync, "firstOrDefaultAsync");
    bind(groupBy_1.groupBy, "groupBy");
    bind(groupByAsync_1.groupByAsync, "groupByAsync");
    bind(groupByWithSel_1.groupByWithSel, "groupByWithSel");
    bind(intersect_1.intersect, "intersect");
    bind(intersectAsync_1.intersectAsync, "intersectAsync");
    bind(join_1.join, "joinByKey");
    bind(last_1.last, "last");
    bind(lastAsync_1.lastAsync, "lastAsync");
    bind(lastOrDefault_1.lastOrDefault, "lastOrDefault");
    bind(lastOrDefaultAsync_1.lastOrDefaultAsync, "lastOrDefaultAsync");
    bind(max_1.max, "max");
    bind(maxAsync_1.maxAsync, "maxAsync");
    bind(min_1.min, "min");
    bind(minAsync_1.minAsync, "minAsync");
    bind(ofType_1.ofType, "ofType");
    bind(orderBy_1.orderBy, "orderBy");
    bind(orderByAsync_1.orderByAsync, "orderByAsync");
    bind(orderByDescending_1.orderByDescending, "orderByDescending");
    bind(orderByDescendingAsync_1.orderByDescendingAsync, "orderByDescendingAsync");
    bind(reverse_1.reverse, "reverse");
    bind(select_1.select, "select");
    bind(selectAsync_1.selectAsync, "selectAsync");
    bind(selectMany_1.selectMany, "selectMany");
    bind(selectManyAsync_1.selectManyAsync, "selectManyAsync");
    bind(sequenceEquals_1.sequenceEquals, "sequenceEquals");
    bind(sequenceEqualsAsync_1.sequenceEqualsAsync, "sequenceEqualsAsync");
    bind(single_1.single, "single");
    bind(singleAsync_1.singleAsync, "singleAsync");
    bind(singleOrDefault_1.singleOrDefault, "singleOrDefault");
    bind(singleOrDefaultAsync_1.singleOrDefaultAsync, "singleOrDefaultAsync");
    bind(skip_1.skip, "skip");
    bind(skipWhile_1.skipWhile, "skipWhile");
    bind(skipWhileAsync_1.skipWhileAsync, "skipWhileAsync");
    bind(sum_1.sum, "sum");
    bind(sumAsync_1.sumAsync, "sumAsync");
    bind(take_1.take, "take");
    bind(takeWhile_1.takeWhile, "takeWhile");
    bind(takeWhileAsync_1.takeWhileAsync, "takeWhileAsync");
    bind(toArray_1.toArray, "toArray");
    bind(toMap_1.toMap, "toMap");
    bind(toMapAsync_1.toMapAsync, "toMapAsync");
    bind(toSet_1.toSet, "toSet");
    bind(union_1.union, "union");
    bind(unionAsync_1.unionAsync, "unionAsync");
    bind(where_1.where, "where");
    bind(whereAsync_1.whereAsync, "whereAsync");
    bind(zip_1.zip, "zip");
    bind(zipAsync_1.zipAsync, "zipAsync");
};


/***/ }),

/***/ 3083:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindLinqAsync = void 0;
const aggregate_1 = __nccwpck_require__(3822);
const all_1 = __nccwpck_require__(1383);
const allAsync_1 = __nccwpck_require__(4380);
const any_1 = __nccwpck_require__(5414);
const anyAsync_1 = __nccwpck_require__(6897);
const asParallel_1 = __nccwpck_require__(441);
const average_1 = __nccwpck_require__(950);
const averageAsync_1 = __nccwpck_require__(1525);
const concatenate_1 = __nccwpck_require__(2548);
const contains_1 = __nccwpck_require__(9498);
const containsAsync_1 = __nccwpck_require__(6486);
const count_1 = __nccwpck_require__(1283);
const countAsync_1 = __nccwpck_require__(4686);
const distinct_1 = __nccwpck_require__(1289);
const distinctAsync_1 = __nccwpck_require__(9106);
const each_1 = __nccwpck_require__(2763);
const eachAsync_1 = __nccwpck_require__(2610);
const elementAt_1 = __nccwpck_require__(5484);
const elementAtOrDefault_1 = __nccwpck_require__(407);
const except_1 = __nccwpck_require__(6061);
const exceptAsync_1 = __nccwpck_require__(6349);
const first_1 = __nccwpck_require__(8281);
const firstAsync_1 = __nccwpck_require__(6322);
const firstOrDefault_1 = __nccwpck_require__(886);
const firstOrDefaultAsync_1 = __nccwpck_require__(2619);
const groupBy_1 = __nccwpck_require__(6617);
const groupByAsync_1 = __nccwpck_require__(4376);
const groupByWithSel_1 = __nccwpck_require__(8207);
const intersect_1 = __nccwpck_require__(7728);
const intersectAsync_1 = __nccwpck_require__(1736);
const join_1 = __nccwpck_require__(165);
const last_1 = __nccwpck_require__(3700);
const lastAsync_1 = __nccwpck_require__(7543);
const lastOrDefault_1 = __nccwpck_require__(2424);
const lastOrDefaultAsync_1 = __nccwpck_require__(2667);
const max_1 = __nccwpck_require__(5338);
const maxAsync_1 = __nccwpck_require__(1705);
const min_1 = __nccwpck_require__(2380);
const minAsync_1 = __nccwpck_require__(4916);
const ofType_1 = __nccwpck_require__(6592);
const orderBy_1 = __nccwpck_require__(1526);
const orderByAsync_1 = __nccwpck_require__(4392);
const orderByDescending_1 = __nccwpck_require__(8610);
const orderByDescendingAsync_1 = __nccwpck_require__(4310);
const reverse_1 = __nccwpck_require__(9158);
const select_1 = __nccwpck_require__(4187);
const selectAsync_1 = __nccwpck_require__(8786);
const selectMany_1 = __nccwpck_require__(8624);
const selectManyAsync_1 = __nccwpck_require__(2627);
const sequenceEquals_1 = __nccwpck_require__(7058);
const sequenceEqualsAsync_1 = __nccwpck_require__(8488);
const single_1 = __nccwpck_require__(1430);
const singleAsync_1 = __nccwpck_require__(4572);
const singleOrDefault_1 = __nccwpck_require__(5053);
const singleOrDefaultAsync_1 = __nccwpck_require__(6031);
const skip_1 = __nccwpck_require__(4114);
const skipWhile_1 = __nccwpck_require__(5477);
const skipWhileAsync_1 = __nccwpck_require__(5706);
const sum_1 = __nccwpck_require__(9890);
const sumAsync_1 = __nccwpck_require__(7237);
const take_1 = __nccwpck_require__(8143);
const takeWhile_1 = __nccwpck_require__(9458);
const takeWhileAsync_1 = __nccwpck_require__(9247);
const toArray_1 = __nccwpck_require__(5029);
const toMap_1 = __nccwpck_require__(7060);
const toMapAsync_1 = __nccwpck_require__(8649);
const toSet_1 = __nccwpck_require__(4145);
const union_1 = __nccwpck_require__(3410);
const unionAsync_1 = __nccwpck_require__(9953);
const where_1 = __nccwpck_require__(9156);
const whereAsync_1 = __nccwpck_require__(377);
const zip_1 = __nccwpck_require__(4440);
const zipAsync_1 = __nccwpck_require__(9774);
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
/**
 * Binds LINQ methods to an iterable type
 * @param object Iterable Type
 */
exports.bindLinqAsync = (object) => {
    const prototype = object.prototype;
    const bind = (func, key) => {
        switch (func.length) {
            case 1:
                prototype[key] = function () {
                    return func(this);
                };
                return;
            case 2:
                prototype[key] = function (a) {
                    return func(this, a);
                };
                return;
            case 3:
                prototype[key] = function (a, b) {
                    return func(this, a, b);
                };
                return;
            case 4:
                prototype[key] = function (a, b, c) {
                    return func(this, a, b, c);
                };
                return;
            case 5:
                prototype[key] = function (a, b, c, d) {
                    return func(this, a, b, c, d);
                };
                return;
            default:
                throw new Error("Invalid Function");
        }
    };
    bind(aggregate_1.aggregate, "aggregate");
    bind(all_1.all, "all");
    bind(allAsync_1.allAsync, "allAsync");
    bind(any_1.any, "any");
    bind(anyAsync_1.anyAsync, "anyAsync");
    // bind(asAsync, "asAsync")
    bind(asParallel_1.asParallel, "asParallel");
    bind(average_1.average, "average");
    bind(averageAsync_1.averageAsync, "averageAsync");
    bind(concatenate_1.concatenate, "concatenate");
    prototype.contains = function (value, comparer) {
        return contains_1.contains(this, value, comparer);
    };
    bind(containsAsync_1.containsAsync, "containsAsync");
    bind(count_1.count, "count");
    bind(countAsync_1.countAsync, "countAsync");
    prototype.distinct = function (comparer) {
        return distinct_1.distinct(this, comparer);
    };
    bind(distinctAsync_1.distinctAsync, "distinctAsync");
    bind(each_1.each, "each");
    bind(eachAsync_1.eachAsync, "eachAsync");
    bind(elementAt_1.elementAt, "elementAt");
    bind(elementAtOrDefault_1.elementAtOrDefault, "elementAtOrDefault");
    bind(except_1.except, "except");
    bind(exceptAsync_1.exceptAsync, "exceptAsync");
    bind(first_1.first, "first");
    bind(firstAsync_1.firstAsync, "firstAsync");
    bind(firstOrDefault_1.firstOrDefault, "firstOrDefault");
    bind(firstOrDefaultAsync_1.firstOrDefaultAsync, "firstOrDefaultAsync");
    bind(groupBy_1.groupBy, "groupBy");
    bind(groupByAsync_1.groupByAsync, "groupByAsync");
    bind(groupByWithSel_1.groupByWithSel, "groupByWithSel");
    prototype.intersect = function (second, comparer) {
        return intersect_1.intersect(this, second, comparer);
    };
    bind(intersectAsync_1.intersectAsync, "intersectAsync");
    prototype.joinByKey = function (inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
        return join_1.join(this, inner, outerKeySelector, innerKeySelector, resultSelector, comparer);
    };
    bind(last_1.last, "last");
    bind(lastAsync_1.lastAsync, "lastAsync");
    bind(lastOrDefault_1.lastOrDefault, "lastOrDefault");
    bind(lastOrDefaultAsync_1.lastOrDefaultAsync, "lastOrDefaultAsync");
    bind(max_1.max, "max");
    bind(maxAsync_1.maxAsync, "maxAsync");
    bind(min_1.min, "min");
    bind(minAsync_1.minAsync, "minAsync");
    bind(ofType_1.ofType, "ofType");
    bind(orderBy_1.orderBy, "orderBy");
    bind(orderByAsync_1.orderByAsync, "orderByAsync");
    bind(orderByDescending_1.orderByDescending, "orderByDescending");
    bind(orderByDescendingAsync_1.orderByDescendingAsync, "orderByDescendingAsync");
    bind(reverse_1.reverse, "reverse");
    bind(select_1.select, "select");
    bind(selectAsync_1.selectAsync, "selectAsync");
    bind(selectMany_1.selectMany, "selectMany");
    bind(selectManyAsync_1.selectManyAsync, "selectManyAsync");
    prototype.sequenceEquals = function (second, comparer) {
        return sequenceEquals_1.sequenceEquals(this, second, comparer);
    };
    bind(sequenceEqualsAsync_1.sequenceEqualsAsync, "sequenceEqualsAsync");
    bind(single_1.single, "single");
    bind(singleAsync_1.singleAsync, "singleAsync");
    bind(singleOrDefault_1.singleOrDefault, "singleOrDefault");
    bind(singleOrDefaultAsync_1.singleOrDefaultAsync, "singleOrDefaultAsync");
    bind(skip_1.skip, "skip");
    bind(skipWhile_1.skipWhile, "skipWhile");
    bind(skipWhileAsync_1.skipWhileAsync, "skipWhileAsync");
    bind(sum_1.sum, "sum");
    bind(sumAsync_1.sumAsync, "sumAsync");
    bind(take_1.take, "take");
    bind(takeWhile_1.takeWhile, "takeWhile");
    bind(takeWhileAsync_1.takeWhileAsync, "takeWhileAsync");
    bind(toArray_1.toArray, "toArray");
    bind(toMap_1.toMap, "toMap");
    bind(toMapAsync_1.toMapAsync, "toMapAsync");
    bind(toSet_1.toSet, "toSet");
    bind(union_1.union, "union");
    bind(unionAsync_1.unionAsync, "unionAsync");
    bind(where_1.where, "where");
    bind(whereAsync_1.whereAsync, "whereAsync");
    bind(zip_1.zip, "zip");
    bind(zipAsync_1.zipAsync, "zipAsync");
};


/***/ }),

/***/ 9354:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindLinqParallel = void 0;
const aggregate_1 = __nccwpck_require__(3912);
const all_1 = __nccwpck_require__(8475);
const allAsync_1 = __nccwpck_require__(1256);
const any_1 = __nccwpck_require__(6979);
const anyAsync_1 = __nccwpck_require__(7637);
const asAsync_1 = __nccwpck_require__(1944);
const average_1 = __nccwpck_require__(4012);
const averageAsync_1 = __nccwpck_require__(3927);
const concatenate_1 = __nccwpck_require__(6034);
const contains_1 = __nccwpck_require__(2270);
const containsAsync_1 = __nccwpck_require__(4327);
const count_1 = __nccwpck_require__(4363);
const countAsync_1 = __nccwpck_require__(3435);
const distinct_1 = __nccwpck_require__(5186);
const distinctAsync_1 = __nccwpck_require__(1106);
const each_1 = __nccwpck_require__(969);
const eachAsync_1 = __nccwpck_require__(6055);
const elementAt_1 = __nccwpck_require__(959);
const elementAtOrDefault_1 = __nccwpck_require__(9571);
const except_1 = __nccwpck_require__(5606);
const exceptAsync_1 = __nccwpck_require__(5674);
const first_1 = __nccwpck_require__(8517);
const firstAsync_1 = __nccwpck_require__(6270);
const firstOrDefault_1 = __nccwpck_require__(3153);
const firstOrDefaultAsync_1 = __nccwpck_require__(1327);
const groupBy_1 = __nccwpck_require__(3589);
const groupByAsync_1 = __nccwpck_require__(2477);
const groupByWithSel_1 = __nccwpck_require__(6630);
const intersect_1 = __nccwpck_require__(2166);
const intersectAsync_1 = __nccwpck_require__(3650);
const join_1 = __nccwpck_require__(7048);
const last_1 = __nccwpck_require__(815);
const lastAsync_1 = __nccwpck_require__(2145);
const lastOrDefault_1 = __nccwpck_require__(7621);
const lastOrDefaultAsync_1 = __nccwpck_require__(1370);
const max_1 = __nccwpck_require__(3661);
const maxAsync_1 = __nccwpck_require__(1121);
const min_1 = __nccwpck_require__(2299);
const minAsync_1 = __nccwpck_require__(9111);
const ofType_1 = __nccwpck_require__(2534);
const orderBy_1 = __nccwpck_require__(211);
const orderByAsync_1 = __nccwpck_require__(8744);
const orderByDescending_1 = __nccwpck_require__(1268);
const orderByDescendingAsync_1 = __nccwpck_require__(8011);
const reverse_1 = __nccwpck_require__(9476);
const select_1 = __nccwpck_require__(1611);
const selectAsync_1 = __nccwpck_require__(1803);
const selectMany_1 = __nccwpck_require__(2637);
const selectManyAsync_1 = __nccwpck_require__(5961);
const sequenceEquals_1 = __nccwpck_require__(2790);
const sequenceEqualsAsync_1 = __nccwpck_require__(3839);
const single_1 = __nccwpck_require__(9360);
const singleAsync_1 = __nccwpck_require__(389);
const singleOrDefault_1 = __nccwpck_require__(6648);
const singleOrDefaultAsync_1 = __nccwpck_require__(3096);
const skip_1 = __nccwpck_require__(8392);
const skipWhile_1 = __nccwpck_require__(9226);
const skipWhileAsync_1 = __nccwpck_require__(4057);
const sum_1 = __nccwpck_require__(429);
const sumAsync_1 = __nccwpck_require__(21);
const take_1 = __nccwpck_require__(7609);
const takeWhile_1 = __nccwpck_require__(5009);
const takeWhileAsync_1 = __nccwpck_require__(8842);
const toArray_1 = __nccwpck_require__(2537);
const toMap_1 = __nccwpck_require__(2031);
const toMapAsync_1 = __nccwpck_require__(3037);
const toSet_1 = __nccwpck_require__(9632);
const union_1 = __nccwpck_require__(3615);
const unionAsync_1 = __nccwpck_require__(5945);
const where_1 = __nccwpck_require__(719);
const whereAsync_1 = __nccwpck_require__(6742);
const zip_1 = __nccwpck_require__(8763);
const zipAsync_1 = __nccwpck_require__(669);
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
/**
 * Binds LINQ methods to an iterable type
 * @param object Iterable Type
 */
exports.bindLinqParallel = (object) => {
    const wPrototype = object.prototype;
    const prototype = wPrototype;
    const bind = (func, key) => {
        switch (func.length) {
            case 1:
                wPrototype[key] = function () {
                    return func(this);
                };
                return;
            case 2:
                wPrototype[key] = function (a) {
                    return func(this, a);
                };
                return;
            case 3:
                wPrototype[key] = function (a, b) {
                    return func(this, a, b);
                };
                return;
            case 4:
                wPrototype[key] = function (a, b, c) {
                    return func(this, a, b, c);
                };
                return;
            case 5:
                wPrototype[key] = function (a, b, c, d) {
                    return func(this, a, b, c, d);
                };
                return;
            default:
                throw new Error("Invalid Function");
        }
    };
    bind(aggregate_1.aggregate, "aggregate");
    bind(all_1.all, "all");
    bind(allAsync_1.allAsync, "allAsync");
    bind(any_1.any, "any");
    bind(anyAsync_1.anyAsync, "anyAsync");
    bind(asAsync_1.asAsync, "asAsync");
    // bind(asParallel)
    bind(average_1.average, "average");
    bind(averageAsync_1.averageAsync, "averageAsync");
    bind(concatenate_1.concatenate, "concatenate");
    prototype.contains = function (value, comparer) {
        return contains_1.contains(this, value, comparer);
    };
    bind(containsAsync_1.containsAsync, "containsAsync");
    bind(count_1.count, "count");
    bind(countAsync_1.countAsync, "countAsync");
    prototype.distinct = function (comparer) {
        return distinct_1.distinct(this, comparer);
    };
    bind(distinctAsync_1.distinctAsync, "distinctAsync");
    bind(each_1.each, "each");
    bind(eachAsync_1.eachAsync, "eachAsync");
    bind(elementAt_1.elementAt, "elementAt");
    bind(elementAtOrDefault_1.elementAtOrDefault, "elementAtOrDefault");
    bind(except_1.except, "except");
    bind(exceptAsync_1.exceptAsync, "exceptAsync");
    bind(first_1.first, "first");
    bind(firstAsync_1.firstAsync, "firstAsync");
    bind(firstOrDefault_1.firstOrDefault, "firstOrDefault");
    bind(firstOrDefaultAsync_1.firstOrDefaultAsync, "firstOrDefaultAsync");
    bind(groupBy_1.groupBy, "groupBy");
    bind(groupByAsync_1.groupByAsync, "groupByAsync");
    bind(groupByWithSel_1.groupByWithSel, "groupByWithSel");
    prototype.intersect = function (second, comparer) {
        return intersect_1.intersect(this, second, comparer);
    };
    bind(intersectAsync_1.intersectAsync, "intersectAsync");
    prototype.joinByKey = function (inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
        return join_1.join(this, inner, outerKeySelector, innerKeySelector, resultSelector, comparer);
    };
    bind(last_1.last, "last");
    bind(lastAsync_1.lastAsync, "lastAsync");
    bind(lastOrDefault_1.lastOrDefault, "lastOrDefault");
    bind(lastOrDefaultAsync_1.lastOrDefaultAsync, "lastOrDefaultAsync");
    bind(max_1.max, "max");
    bind(maxAsync_1.maxAsync, "maxAsync");
    bind(min_1.min, "min");
    bind(minAsync_1.minAsync, "minAsync");
    bind(ofType_1.ofType, "ofType");
    bind(orderBy_1.orderBy, "orderBy");
    bind(orderByAsync_1.orderByAsync, "orderByAsync");
    bind(orderByDescending_1.orderByDescending, "orderByDescending");
    bind(orderByDescendingAsync_1.orderByDescendingAsync, "orderByDescendingAsync");
    bind(reverse_1.reverse, "reverse");
    bind(select_1.select, "select");
    bind(selectAsync_1.selectAsync, "selectAsync");
    bind(selectMany_1.selectMany, "selectMany");
    bind(selectManyAsync_1.selectManyAsync, "selectManyAsync");
    prototype.sequenceEquals = function (second, comparer) {
        return sequenceEquals_1.sequenceEquals(this, second, comparer);
    };
    bind(sequenceEqualsAsync_1.sequenceEqualsAsync, "sequenceEqualsAsync");
    bind(single_1.single, "single");
    bind(singleAsync_1.singleAsync, "singleAsync");
    bind(singleOrDefault_1.singleOrDefault, "singleOrDefault");
    bind(singleOrDefaultAsync_1.singleOrDefaultAsync, "singleOrDefaultAsync");
    bind(skip_1.skip, "skip");
    bind(skipWhile_1.skipWhile, "skipWhile");
    bind(skipWhileAsync_1.skipWhileAsync, "skipWhileAsync");
    bind(sum_1.sum, "sum");
    bind(sumAsync_1.sumAsync, "sumAsync");
    bind(take_1.take, "take");
    bind(takeWhile_1.takeWhile, "takeWhile");
    bind(takeWhileAsync_1.takeWhileAsync, "takeWhileAsync");
    bind(toArray_1.toArray, "toArray");
    bind(toMap_1.toMap, "toMap");
    bind(toMapAsync_1.toMapAsync, "toMapAsync");
    bind(toSet_1.toSet, "toSet");
    bind(union_1.union, "union");
    bind(unionAsync_1.unionAsync, "unionAsync");
    bind(where_1.where, "where");
    bind(whereAsync_1.whereAsync, "whereAsync");
    bind(zip_1.zip, "zip");
    bind(zipAsync_1.zipAsync, "zipAsync");
};


/***/ }),

/***/ 2195:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindString = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Adds LINQ methods to String prototype
 */
exports.bindString = () => {
    const prototype = String.prototype;
    const propertyNames = Object.getOwnPropertyNames(BasicEnumerable_1.BasicEnumerable.prototype)
        // eslint-disable-next-line @typescript-eslint/array-type
        .filter((v) => v !== "constructor");
    for (const prop of propertyNames) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        prototype[prop] = prototype[prop] || BasicEnumerable_1.BasicEnumerable.prototype[prop];
    }
    prototype.first = function (predicate) {
        if (predicate) {
            for (let i = 0; i < this.length; i++) {
                const value = this[i];
                if (predicate(value) === true) {
                    return value;
                }
            }
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
        }
        if (this.length === 0) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
        }
        return this[0];
    };
    prototype.firstOrDefault = function (predicate) {
        if (predicate) {
            for (let i = 0; i < this.length; i++) {
                const value = this[i];
                if (predicate(value) === true) {
                    return value;
                }
            }
            return null;
        }
        return this.length === 0 ? null : this[0];
    };
    prototype.count = function (predicate) {
        if (predicate) {
            // eslint-disable-next-line no-shadow
            let count = 0;
            for (let i = 0; i < this.length; i++) {
                if (predicate(this[i]) === true) {
                    count++;
                }
            }
            return count;
        }
        else {
            return this.length;
        }
    };
    prototype.elementAt = function (index) {
        if (index < 0 || index >= this.length) {
            throw new shared_1.ArgumentOutOfRangeException("index");
        }
        return this[index];
    };
    prototype.elementAtOrDefault = function (index) {
        return this[index] || null;
    };
    prototype.last = function (predicate) {
        if (predicate) {
            for (let i = this.length - 1; i >= 0; i--) {
                const value = this[i];
                if (predicate(value) === true) {
                    return value;
                }
            }
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
        }
        else {
            if (this.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            return this[this.length - 1];
        }
    };
    prototype.lastOrDefault = function (predicate) {
        if (predicate) {
            for (let i = this.length - 1; i >= 0; i--) {
                const value = this[i];
                if (predicate(value) === true) {
                    return value;
                }
            }
            return null;
        }
        else {
            return this.length === 0 ? null : this[this.length - 1];
        }
    };
    prototype.reverse = function () {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outer = this;
        function* generator() {
            for (let i = outer.length - 1; i >= 0; i--) {
                yield outer[i];
            }
        }
        return new BasicEnumerable_1.BasicEnumerable(generator);
    };
};


/***/ }),

/***/ 7998:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initializeLinq = void 0;
const bindArray_1 = __nccwpck_require__(973);
const bindString_1 = __nccwpck_require__(2195);
const bindLinq_1 = __nccwpck_require__(6802);
/**
 * Binds LINQ methods to Array Types, Map, Set, and String
 */
exports.initializeLinq = () => {
    bindLinq_1.bindLinq(Map);
    bindLinq_1.bindLinq(Set);
    bindString_1.bindString();
    bindArray_1.bindArray(Array);
    bindArray_1.bindArray(Int8Array);
    bindArray_1.bindArray(Int16Array);
    bindArray_1.bindArray(Int32Array);
    bindArray_1.bindArray(Uint8Array);
    bindArray_1.bindArray(Uint8ClampedArray);
    bindArray_1.bindArray(Uint16Array);
    bindArray_1.bindArray(Uint32Array);
    bindArray_1.bindArray(Float32Array);
    bindArray_1.bindArray(Float64Array);
};


/***/ }),

/***/ 8593:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bindString = exports.bindArray = exports.bindLinqAsync = exports.bindLinq = void 0;
const BasicAsyncEnumerable_1 = __nccwpck_require__(7563);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const BasicEnumerable_1 = __nccwpck_require__(3706);
const bindArray_1 = __nccwpck_require__(973);
Object.defineProperty(exports, "bindArray", ({ enumerable: true, get: function () { return bindArray_1.bindArray; } }));
const bindArrayEnumerable_1 = __nccwpck_require__(3091);
const bindLinq_1 = __nccwpck_require__(6802);
Object.defineProperty(exports, "bindLinq", ({ enumerable: true, get: function () { return bindLinq_1.bindLinq; } }));
const bindLinqAsync_1 = __nccwpck_require__(3083);
Object.defineProperty(exports, "bindLinqAsync", ({ enumerable: true, get: function () { return bindLinqAsync_1.bindLinqAsync; } }));
const bindLinqParallel_1 = __nccwpck_require__(9354);
const bindString_1 = __nccwpck_require__(2195);
Object.defineProperty(exports, "bindString", ({ enumerable: true, get: function () { return bindString_1.bindString; } }));
// To avoid circular dependencies, we bind LINQ methods to classes here
bindLinq_1.bindLinq(BasicEnumerable_1.BasicEnumerable);
bindLinqAsync_1.bindLinqAsync(BasicAsyncEnumerable_1.BasicAsyncEnumerable);
bindLinqParallel_1.bindLinqParallel(BasicParallelEnumerable_1.BasicParallelEnumerable);
// Array Enumerable extends Array and has some custom optimizations
bindArrayEnumerable_1.bindArrayEnumerable();
var initializeLinq_1 = __nccwpck_require__(7998);
Object.defineProperty(exports, "initializeLinq", ({ enumerable: true, get: function () { return initializeLinq_1.initializeLinq; } }));


/***/ }),

/***/ 6716:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BasicParallelEnumerable = void 0;
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface */
/**
 * Base implementation of IParallelEnumerable<T>
 * @private
 */
class BasicParallelEnumerable {
    constructor(dataFunc) {
        this.dataFunc = dataFunc;
    }
    [Symbol.asyncIterator]() {
        const { dataFunc } = this;
        async function* iterator() {
            switch (dataFunc.type) {
                case 1 /* ArrayOfPromises */:
                    for (const value of dataFunc.generator()) {
                        yield value;
                    }
                    break;
                case 2 /* PromiseOfPromises */:
                    for (const value of await dataFunc.generator()) {
                        yield value;
                    }
                    break;
                case 0 /* PromiseToArray */:
                default:
                    for (const value of await dataFunc.generator()) {
                        yield value;
                    }
                    break;
            }
        }
        return iterator();
    }
}
exports.BasicParallelEnumerable = BasicParallelEnumerable;


/***/ }),

/***/ 6039:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrderedParallelEnumerable = void 0;
const asAsyncSortedKeyValues_1 = __nccwpck_require__(3779);
const asAsyncSortedKeyValuesSync_1 = __nccwpck_require__(2978);
const asSortedKeyValues_1 = __nccwpck_require__(3858);
const asSortedKeyValuesSync_1 = __nccwpck_require__(875);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Ordered Parallel Enumerable
 * @private
 */
class OrderedParallelEnumerable extends BasicParallelEnumerable_1.BasicParallelEnumerable {
    constructor(orderedPairs) {
        super({
            generator: async () => {
                const asyncVals = orderedPairs();
                const array = [];
                for await (const val of asyncVals) {
                    array.push(...val);
                }
                return array;
            },
            type: 0 /* PromiseToArray */,
        });
        this.orderedPairs = orderedPairs;
    }
    static generateAsync(source, keySelector, ascending, comparer) {
        let orderedPairs;
        if (source instanceof OrderedParallelEnumerable) {
            orderedPairs = async function* () {
                for await (const pair of source.orderedPairs()) {
                    yield* asAsyncSortedKeyValuesSync_1.asAsyncSortedKeyValuesSync(pair, keySelector, ascending, comparer);
                }
            };
        }
        else {
            orderedPairs = () => asAsyncSortedKeyValues_1.asAsyncSortedKeyValues(source, keySelector, ascending, comparer);
        }
        return new OrderedParallelEnumerable(orderedPairs);
    }
    static generate(source, keySelector, ascending, comparer) {
        let orderedPairs;
        if (source instanceof OrderedParallelEnumerable) {
            orderedPairs = async function* () {
                for await (const pair of source.orderedPairs()) {
                    yield* asSortedKeyValuesSync_1.asSortedKeyValuesSync(pair, keySelector, ascending, comparer);
                }
            };
        }
        else {
            orderedPairs = () => asSortedKeyValues_1.asSortedKeyValues(source, keySelector, ascending, comparer);
        }
        return new OrderedParallelEnumerable(orderedPairs);
    }
    thenBy(keySelector, comparer) {
        return OrderedParallelEnumerable.generate(this, keySelector, true, comparer);
    }
    thenByAsync(keySelector, comparer) {
        return OrderedParallelEnumerable.generateAsync(this, keySelector, true, comparer);
    }
    thenByDescending(keySelector, comparer) {
        return OrderedParallelEnumerable.generate(this, keySelector, false, comparer);
    }
    thenByDescendingAsync(keySelector, comparer) {
        return OrderedParallelEnumerable.generateAsync(this, keySelector, false, comparer);
    }
}
exports.OrderedParallelEnumerable = OrderedParallelEnumerable;


/***/ }),

/***/ 3987:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncKeyMap = void 0;
/**
 * Converts values to a key values map.
 * @param source Async Iterable
 * @param keySelector Async Key Selector for Map
 * @returns Promise for a Map for Key to Values
 */
exports.asAsyncKeyMap = async (source, keySelector) => {
    const map = new Map();
    for await (const item of source) {
        const key = await keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 2176:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncKeyMapSync = void 0;
/**
 * Converts values to a key values map.
 * @param source Iterable
 * @param keySelector Async Key Selector for Map
 * @returns Promise for a Map for Key to Values
 */
exports.asAsyncKeyMapSync = async (source, keySelector) => {
    const map = new Map();
    for (const item of source) {
        const key = await keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 3779:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncSortedKeyValues = void 0;
const asAsyncKeyMap_1 = __nccwpck_require__(3987);
/**
 * Sorts values in an Async Iterable based on key and a key comparer.
 * @param source Async Iterable
 * @param keySelector Async Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator of arrays
 */
async function* asAsyncSortedKeyValues(source, keySelector, ascending, comparer) {
    const map = await asAsyncKeyMap_1.asAsyncKeyMap(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asAsyncSortedKeyValues = asAsyncSortedKeyValues;


/***/ }),

/***/ 2978:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsyncSortedKeyValuesSync = void 0;
const asAsyncKeyMapSync_1 = __nccwpck_require__(2176);
/**
 * Sorts values in an Async Iterable based on key and a key comparer.
 * @param source Iterable
 * @param keySelector Async Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator of arrays
 */
async function* asAsyncSortedKeyValuesSync(source, keySelector, ascending, comparer) {
    const map = await asAsyncKeyMapSync_1.asAsyncKeyMapSync(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asAsyncSortedKeyValuesSync = asAsyncSortedKeyValuesSync;


/***/ }),

/***/ 1127:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asKeyMap = void 0;
/**
 * Converts values to a key values map.
 * @param source Async Iterable
 * @param keySelector Key Selector for Map
 * @returns Promise for a Map for Key to Values
 */
exports.asKeyMap = async (source, keySelector) => {
    const map = new Map();
    for await (const item of source) {
        const key = keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 2952:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asKeyMapSync = void 0;
/**
 * Converts values to a key values map.
 * @param source Iterable
 * @param keySelector Key Selector for Map
 * @returns Map for Key to Values
 */
exports.asKeyMapSync = (source, keySelector) => {
    const map = new Map();
    for (const item of source) {
        const key = keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 3858:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asSortedKeyValues = void 0;
const asKeyMap_1 = __nccwpck_require__(1127);
/**
 * Sorts values in an Iterable based on key and a key comparer.
 * @param source Async Iterable
 * @param keySelector Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator
 */
async function* asSortedKeyValues(source, keySelector, ascending, comparer) {
    const map = await asKeyMap_1.asKeyMap(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asSortedKeyValues = asSortedKeyValues;


/***/ }),

/***/ 875:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asSortedKeyValuesSync = void 0;
const asKeyMapSync_1 = __nccwpck_require__(2952);
/**
 * Sorts values in an Iterable based on key and a key comparer.
 * @param source Iterable
 * @param keySelector Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator
 */
async function* asSortedKeyValuesSync(source, keySelector, ascending, comparer) {
    const map = asKeyMapSync_1.asKeyMapSync(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asSortedKeyValuesSync = asSortedKeyValuesSync;


/***/ }),

/***/ 9931:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.nextIteration = void 0;
/* eslint-disable  */
/**
 * @private Don't use directly.
 */
exports.nextIteration = (source, onfulfilled) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const generator = () => dataFunc.generator().then((x) => {
                const convValues = new Array(x.length);
                for (let i = 0; i < x.length; i++) {
                    convValues[i] = onfulfilled(x[i]);
                }
                return convValues;
            });
            return {
                generator,
                type: 0 /* PromiseToArray */,
            };
        }
        case 1 /* ArrayOfPromises */: {
            const generator = () => {
                const previousData = dataFunc.generator();
                const newPromises = new Array(previousData.length);
                for (let i = 0; i < previousData.length; i++) {
                    newPromises[i] = previousData[i].then(onfulfilled);
                }
                return newPromises;
            };
            return {
                generator,
                type: 1 /* ArrayOfPromises */,
            };
        }
        case 2 /* PromiseOfPromises */: {
            const generator = async () => {
                const previousData = await dataFunc.generator();
                const newPromises = new Array(previousData.length);
                for (let i = 0; i < previousData.length; i++) {
                    newPromises[i] = previousData[i].then(onfulfilled);
                }
                return newPromises;
            };
            return {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
        }
    }
};


/***/ }),

/***/ 1892:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.nextIterationAsync = void 0;
/* eslint-disable  */
/**
 * @private Next Iteration for Parallel Enumerable
 */
exports.nextIterationAsync = (source, onfulfilled) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const generator = async () => {
                const results = await dataFunc.generator();
                const newPromises = new Array(results.length);
                for (let i = 0; i < results.length; i++) {
                    newPromises[i] = onfulfilled(results[i]);
                }
                return newPromises;
            };
            return {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
        }
        case 1 /* ArrayOfPromises */: {
            const generator = () => dataFunc
                .generator()
                .map((promise) => promise.then(onfulfilled));
            return {
                generator,
                type: 1 /* ArrayOfPromises */,
            };
        }
        case 2 /* PromiseOfPromises */: {
            const generator = async () => {
                const promises = await dataFunc.generator();
                return promises.map((promise) => promise.then(onfulfilled));
            };
            return {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
        }
    }
};


/***/ }),

/***/ 1734:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.nextIterationWithIndex = void 0;
/* eslint-disable  */
exports.nextIterationWithIndex = (source, onfulfilled) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const generator = () => dataFunc.generator().then((x) => {
                const convValues = new Array(x.length);
                for (let i = 0; i < x.length; i++) {
                    convValues[i] = onfulfilled(x[i], i);
                }
                return convValues;
            });
            return {
                generator,
                type: 0 /* PromiseToArray */,
            };
        }
        case 1 /* ArrayOfPromises */: {
            const generator = () => {
                const previousData = dataFunc.generator();
                const newPromises = new Array(previousData.length);
                for (let i = 0; i < previousData.length; i++) {
                    newPromises[i] = previousData[i].then((value) => {
                        return onfulfilled(value, i);
                    });
                }
                return newPromises;
            };
            return {
                generator,
                type: 1 /* ArrayOfPromises */,
            };
        }
        case 2 /* PromiseOfPromises */: {
            const generator = async () => {
                const previousData = await dataFunc.generator();
                const newPromises = new Array(previousData.length);
                for (let i = 0; i < previousData.length; i++) {
                    newPromises[i] = previousData[i].then((value) => onfulfilled(value, i));
                }
                return newPromises;
            };
            return {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
        }
    }
};


/***/ }),

/***/ 1983:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.nextIterationWithIndexAsync = void 0;
/* eslint-disable  */
exports.nextIterationWithIndexAsync = (source, onfulfilled) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const generator = async () => {
                const results = await dataFunc.generator();
                const newPromises = new Array(results.length);
                for (let i = 0; i < results.length; i++) {
                    newPromises[i] = onfulfilled(results[i], i);
                }
                return newPromises;
            };
            return {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
        }
        case 1 /* ArrayOfPromises */: {
            const generator = () => dataFunc
                .generator()
                .map((promise, index) => promise.then((x) => onfulfilled(x, index)));
            return {
                generator,
                type: 1 /* ArrayOfPromises */,
            };
        }
        case 2 /* PromiseOfPromises */: {
            const generator = async () => {
                const promises = await dataFunc.generator();
                return promises.map((promise, index) => promise.then((x) => onfulfilled(x, index)));
            };
            return {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
        }
    }
};


/***/ }),

/***/ 3912:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.aggregate = void 0;
const shared_1 = __nccwpck_require__(5897);
function aggregate(source, seedOrFunc, func, resultSelector) {
    if (resultSelector) {
        if (!func) {
            throw new ReferenceError(`TAccumulate function is undefined`);
        }
        return aggregate3(source, seedOrFunc, func, resultSelector);
    }
    else if (func) {
        return aggregate2(source, seedOrFunc, func);
    }
    else {
        return aggregate1(source, seedOrFunc);
    }
}
exports.aggregate = aggregate;
const aggregate1 = async (source, func) => {
    let aggregateValue;
    for await (const value of source) {
        if (aggregateValue) {
            aggregateValue = func(aggregateValue, value);
        }
        else {
            aggregateValue = value;
        }
    }
    if (aggregateValue === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return aggregateValue;
};
const aggregate2 = async (source, seed, func) => {
    let aggregateValue = seed;
    for await (const value of source) {
        aggregateValue = func(aggregateValue, value);
    }
    return aggregateValue;
};
const aggregate3 = async (source, seed, func, resultSelector) => {
    let aggregateValue = seed;
    for await (const value of source) {
        aggregateValue = func(aggregateValue, value);
    }
    return resultSelector(aggregateValue);
};


/***/ }),

/***/ 8475:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.all = void 0;
const _nextIteration_1 = __nccwpck_require__(9931);
/**
 * Determines whether all elements of a sequence satisfy a condition.
 * @param source An IParallelEnumerable<T> that contains the elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
exports.all = (source, predicate) => {
    const nextIter = _nextIteration_1.nextIteration(source, (x) => {
        if (!predicate(x)) {
            throw new Error(String(false));
        }
        return true;
    });
    switch (nextIter.type) {
        case 0 /* PromiseToArray */:
            return nextIter.generator()
                .then(() => true, () => false);
        case 1 /* ArrayOfPromises */:
            return Promise.all(nextIter.generator())
                .then(() => true, () => false);
        case 2 /* PromiseOfPromises */:
            return nextIter.generator()
                .then(Promise.all.bind(Promise))
                .then(() => true, () => false);
    }
};


/***/ }),

/***/ 1256:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.allAsync = void 0;
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Determines whether all elements of a sequence satisfy a condition.
 * @param source An IParallelEnumerable<T> that contains the elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
exports.allAsync = (source, predicate) => {
    const nextIter = _nextIterationAsync_1.nextIterationAsync(source, async (x) => {
        if (await predicate(x) === false) {
            throw new Error(String(false));
        }
        return true;
    });
    switch (nextIter.type) {
        case 0 /* PromiseToArray */:
            return nextIter
                .generator()
                .then(() => true, () => false);
        case 1 /* ArrayOfPromises */:
            return Promise.all(nextIter.generator())
                .then(() => true, () => false);
        case 2 /* PromiseOfPromises */:
            return nextIter.generator()
                .then(Promise.all.bind(Promise))
                .then(() => true, () => false);
    }
};


/***/ }),

/***/ 6979:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.any = void 0;
const _nextIteration_1 = __nccwpck_require__(9931);
/**
 * Determines whether a sequence contains any elements.
 * If predicate is specified, determines whether any element of a sequence satisfies a condition.
 * @param source The IEnumerable<T> to check for emptiness or apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns Whether or not the sequence contains any elements or contains any elements matching the predicate
 */
exports.any = (source, predicate) => {
    if (predicate) {
        return any2(source, predicate);
    }
    else {
        return any1(source);
    }
};
const any1 = async (source) => {
    const dataFunc = source.dataFunc;
    let values;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */:
            values = await dataFunc.generator();
            return values.length !== 0;
        case 1 /* ArrayOfPromises */:
            values = dataFunc.generator();
            return values.length !== 0;
        case 2 /* PromiseOfPromises */:
            values = await dataFunc.generator();
            return values.length !== 0;
    }
};
const any2 = async (source, predicate) => {
    const dataFunc = _nextIteration_1.nextIteration(source, predicate);
    let values;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */:
            values = await dataFunc.generator();
            return values.includes(true);
        case 1 /* ArrayOfPromises */:
            values = await Promise.all(dataFunc.generator());
            return values.includes(true);
        case 2 /* PromiseOfPromises */:
            values = await Promise.all(await dataFunc.generator());
            return values.includes(true);
    }
};


/***/ }),

/***/ 7637:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.anyAsync = void 0;
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Determines whether any element of a sequence satisfies a condition.
 * @param source An IParallelEnumerable<T> whose elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns Whether or not the parallel sequence contains any value (from the predicate)
 */
function anyAsync(source, predicate) {
    const nextIter = _nextIterationAsync_1.nextIterationAsync(source, predicate);
    switch (nextIter.type) {
        case 0 /* PromiseToArray */:
            return nextIter.generator().then((values) => {
                return values.some((x) => x);
            });
        case 1 /* ArrayOfPromises */:
            return Promise.all(nextIter.generator()).then((values) => {
                return values.some((x) => x);
            });
        case 2 /* PromiseOfPromises */:
            return nextIter.generator().then((values) => Promise.all(values)).then((values) => {
                return values.some((x) => x);
            });
    }
}
exports.anyAsync = anyAsync;


/***/ }),

/***/ 1944:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Converts a IEnumerable enumerable to an async one.
 * @param source A parallel IEnumerable
 * @returns IAsyncEnumerable<TSource>
 */
exports.asAsync = (source) => {
    async function* generator() {
        for await (const value of source) {
            yield value;
        }
    }
    return fromAsync_1.fromAsync(generator);
};


/***/ }),

/***/ 4012:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.average = void 0;
const shared_1 = __nccwpck_require__(5897);
function average(source, selector) {
    if (selector) {
        return average2(source, selector);
    }
    else {
        return average1(source);
    }
}
exports.average = average;
const average1 = async (source) => {
    let value;
    let itemCount;
    for (const item of await source.toArray()) {
        value = (value || 0) + item;
        itemCount = (itemCount || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / itemCount;
};
const average2 = async (source, func) => {
    let value;
    // eslint-disable-next-line no-shadow
    let count;
    for (const item of await source.toArray()) {
        value = (value || 0) + func(item);
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};


/***/ }),

/***/ 3927:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.averageAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Computes the average of a sequence of values
 * that are obtained by invoking a transform function on each element of the input sequence.
 * @param source A sequence of values to calculate the average of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns Average value (from the selector) of this parallel sequence
 */
async function averageAsync(source, selector) {
    const nextIter = _nextIterationAsync_1.nextIterationAsync(source, selector);
    // eslint-disable-next-line @typescript-eslint/array-type
    let values;
    switch (nextIter.type) {
        case 1 /* ArrayOfPromises */:
            values = nextIter.generator();
            break;
        case 2 /* PromiseOfPromises */:
            values = await nextIter.generator();
            break;
        case 0 /* PromiseToArray */:
        default:
            values = await nextIter.generator();
            break;
    }
    if (values.length === 0) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    let value = 0;
    for (const selectedValue of values) {
        value += await selectedValue;
    }
    return value / values.length;
}
exports.averageAsync = averageAsync;


/***/ }),

/***/ 6034:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.concatenate = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Concatenates two sequences.
 * @param first The first sequence to concatenate.
 * @param second The sequence to concatenate to the first sequence.
 * @returns An IParallelEnumerable<T> that contains the concatenated elements of the two input sequences.
 */
function concatenate(
// eslint-disable-next-line no-shadow
first, second) {
    const generator = async () => {
        // Wait for both enumerables
        const promiseResults = await Promise.all([first.toArray(), second.toArray()]);
        // Concat
        const firstData = promiseResults[0];
        const secondData = promiseResults[1];
        const data = new Array(firstData.length + secondData.length);
        let i = 0;
        for (; i < firstData.length; i++) {
            data[i] = firstData[i];
        }
        for (let j = 0; j < secondData.length; j++, i++) {
            data[i] = secondData[j];
        }
        return data;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.concatenate = concatenate;


/***/ }),

/***/ 2270:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contains = void 0;
const shared_1 = __nccwpck_require__(5897);
const _nextIteration_1 = __nccwpck_require__(9931);
/**
 * Determines whether a sequence contains a specified element by using the specified or default IEqualityComparer<T>.
 * @param source A sequence in which to locate a value.
 * @param value The value to locate in the sequence.
 * @param comparer An equality comparer to compare values. Optional.
 * @returns Whether or not source contains the specified value
 */
async function contains(source, value, comparer = shared_1.StrictEqualityComparer) {
    let values;
    if (comparer) {
        values = _nextIteration_1.nextIteration(source, (x) => comparer(value, x));
    }
    else {
        values = _nextIteration_1.nextIteration(source, (x) => x === value);
    }
    switch (values.type) {
        case 0 /* PromiseToArray */: {
            const data = await values.generator();
            return data.some((x) => x);
        }
        case 1 /* ArrayOfPromises */: {
            const data = await Promise.all(values.generator());
            return data.some((x) => x);
        }
        case 2 /* PromiseOfPromises */: {
            const data = await Promise.all(await values.generator());
            return data.some((x) => x);
        }
    }
}
exports.contains = contains;


/***/ }),

/***/ 4327:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.containsAsync = void 0;
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Determines whether a sequence contains a specified element by using the specified or default IEqualityComparer<T>.
 * @param source A sequence in which to locate a value.
 * @param value The value to locate in the sequence.
 * @param comparer An equality comparer to compare values. Optional.
 * @returns Whether or not the specified parallel sequence contains a value
 */
async function containsAsync(source, value, comparer) {
    const values = _nextIterationAsync_1.nextIterationAsync(source, (x) => comparer(value, x));
    switch (values.type) {
        case 0 /* PromiseToArray */: {
            const data = await values.generator();
            return data.some((x) => x);
        }
        case 1 /* ArrayOfPromises */: {
            const data = await Promise.all(values.generator());
            return data.some((x) => x);
        }
        case 2 /* PromiseOfPromises */: {
            const data = await Promise.all(await values.generator());
            return data.some((x) => x);
        }
    }
}
exports.containsAsync = containsAsync;


/***/ }),

/***/ 4363:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.count = void 0;
/**
 * Returns the number of elements in a sequence
 * or represents how many elements in the specified sequence satisfy a condition
 * if the predicate is specified.
 * @param source A sequence that contains elements to be counted.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The number of elements in the input sequence.
 */
exports.count = (source, predicate) => {
    if (predicate) {
        return count2(source, predicate);
    }
    else {
        return count1(source);
    }
};
const count1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */:
        case 2 /* PromiseOfPromises */:
            const arrayData = await source.toArray();
            return arrayData.length;
        case 1 /* ArrayOfPromises */:
            const promises = dataFunc.generator();
            return promises.length;
    }
};
const count2 = async (source, predicate) => {
    const values = await source.toArray();
    let totalCount = 0;
    for (let i = 0; i < values.length; i++) {
        if (predicate(values[i]) === true) {
            totalCount++;
        }
    }
    return totalCount;
};


/***/ }),

/***/ 3435:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.countAsync = void 0;
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Returns how many elements in the specified sequence satisfy a condition
 * @param source A sequence that contains elements to be counted.
 * @param predicate A function to test each element for a condition.
 * @returns How many elements in the specified sequence satisfy the provided predicate.
 */
exports.countAsync = async (source, predicate) => {
    const data = _nextIterationAsync_1.nextIterationAsync(source, predicate);
    let countPromise;
    switch (data.type) {
        case 1 /* ArrayOfPromises */:
            countPromise = Promise.all(data.generator());
            break;
        case 2 /* PromiseOfPromises */:
            countPromise = Promise.all(await data.generator());
            break;
        case 0 /* PromiseToArray */:
        default:
            countPromise = data.generator();
            break;
    }
    let totalCount = 0;
    for (const value of await countPromise) {
        if (value) {
            totalCount++;
        }
    }
    return totalCount;
};


/***/ }),

/***/ 5186:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.distinct = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Returns distinct elements from a sequence by using the default or specified equality comparer to compare values.
 * @param source The sequence to remove duplicate elements from.
 * @param comparer An IEqualityComparer<T> to compare values. Optional. Defaults to Strict Equality Comparison.
 * @returns An IParallelEnumerable<T> that contains distinct elements from the source sequence.
 */
function distinct(source, comparer = shared_1.StrictEqualityComparer) {
    const generator = async () => {
        const distinctElements = [];
        for (const item of await source.toArray()) {
            const foundItem = distinctElements.find((x) => comparer(x, item));
            if (!foundItem) {
                distinctElements.push(item);
            }
        }
        return distinctElements;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.distinct = distinct;


/***/ }),

/***/ 1106:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.distinctAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Returns distinct elements from a sequence by using the specified equality comparer to compare values.
 * @param source The sequence to remove duplicate elements from.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns An IParallelEnumerable<T> that contains distinct elements from the source sequence.
 */
function distinctAsync(source, comparer) {
    const generator = async () => {
        const distinctElements = [];
        outerLoop: for (const item of await source.toArray()) {
            for (const distinctElement of distinctElements) {
                const found = await comparer(distinctElement, item);
                if (found) {
                    continue outerLoop;
                }
            }
            distinctElements.push(item);
        }
        return distinctElements;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.distinctAsync = distinctAsync;


/***/ }),

/***/ 969:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.each = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIteration_1 = __nccwpck_require__(9931);
/**
 * Performs a specified action on each element of the IParallelEnumerable<TSource>
 * @param source The source to iterate
 * @param action The action to take an each element
 * @returns A new IParallelEnumerable<T> that executes the action lazily as you iterate.
 */
function each(source, action) {
    return new BasicParallelEnumerable_1.BasicParallelEnumerable(_nextIteration_1.nextIteration(source, (x) => {
        action(x);
        return x;
    }));
}
exports.each = each;


/***/ }),

/***/ 6055:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.eachAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Performs a specified action on each element of the IParallelEnumerable<TSource>
 * @param source The source to iterate
 * @param action The action to take an each element
 * @returns A new IParallelEnumerable<T> that executes the action lazily as you iterate.
 */
function eachAsync(source, action) {
    return new BasicParallelEnumerable_1.BasicParallelEnumerable(_nextIterationAsync_1.nextIterationAsync(source, async (x) => {
        await action(x);
        return x;
    }));
}
exports.eachAsync = eachAsync;


/***/ }),

/***/ 959:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elementAt = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the element at a specified index in a sequence.
 * @param source An IEnumerable<T> to return an element from.
 * @param index The zero-based index of the element to retrieve.
 * @throws {ArgumentOutOfRangeException}
 * index is less than 0 or greater than or equal to the number of elements in source.
 * @returns The element at the specified index in the sequence.
 */
async function elementAt(source, index) {
    if (index < 0) {
        throw new shared_1.ArgumentOutOfRangeException("index");
    }
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */:
            return dataFunc.generator().then((values) => {
                if (index >= values.length) {
                    throw new shared_1.ArgumentOutOfRangeException("index");
                }
                else {
                    return values[index];
                }
            });
        case 1 /* ArrayOfPromises */:
            return Promise.all(dataFunc.generator()).then((values) => {
                if (index >= values.length) {
                    throw new shared_1.ArgumentOutOfRangeException("index");
                }
                else {
                    return values[index];
                }
            });
        case 2 /* PromiseOfPromises */:
            return dataFunc.generator().then(async (values) => {
                if (index >= values.length) {
                    throw new shared_1.ArgumentOutOfRangeException("index");
                }
                else {
                    return await values[index];
                }
            });
    }
}
exports.elementAt = elementAt;


/***/ }),

/***/ 9571:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elementAtOrDefault = void 0;
/**
 * Returns the element at a specified index in a sequence or a default value if the index is out of range.
 * @param source An IEnumerable<T> to return an element from.
 * @param index The zero-based index of the element to retrieve.
 * @returns
 * default(TSource) if the index is outside the bounds of the source sequence;
 * otherwise, the element at the specified position in the source sequence.
 */
function elementAtOrDefault(source, index) {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */:
            return dataFunc.generator().then((values) => {
                if (index >= values.length) {
                    return null;
                }
                else {
                    return values[index];
                }
            });
        case 1 /* ArrayOfPromises */:
            return Promise.all(dataFunc.generator()).then((values) => {
                if (index >= values.length) {
                    return null;
                }
                else {
                    return values[index];
                }
            });
        case 2 /* PromiseOfPromises */:
            return dataFunc.generator().then(async (values) => {
                if (index >= values.length) {
                    return null;
                }
                else {
                    return await values[index];
                }
            });
    }
}
exports.elementAtOrDefault = elementAtOrDefault;


/***/ }),

/***/ 5606:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.except = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Produces the set difference of two sequences by using the comparer provided
 * or EqualityComparer to compare values.
 * @param first An IAsyncParallel<T> whose elements that are not also in second will be returned.
 * @param second An IAsyncParallel<T> whose elements that also occur in the first sequence
 * will cause those elements to be removed from the returned sequence.
 * @param comparer An IEqualityComparer<T> to compare values. Optional.
 * @returns A sequence that contains the set difference of the elements of two sequences.
 */
function except(
// eslint-disable-next-line no-shadow
first, second, comparer = shared_1.StrictEqualityComparer) {
    const generator = async () => {
        const values = await Promise.all([first.toArray(), second.toArray()]);
        const firstValues = values[0];
        const secondValues = values[1];
        const resultValues = [];
        for (const firstItem of firstValues) {
            let exists = false;
            for (let j = 0; j < secondValues.length; j++) {
                const secondItem = secondValues[j];
                if (comparer(firstItem, secondItem) === true) {
                    exists = true;
                    break;
                }
            }
            if (exists === false) {
                resultValues.push(firstItem);
            }
        }
        return resultValues;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.except = except;


/***/ }),

/***/ 5674:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.exceptAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Produces the set difference of two sequences by using the comparer provided to compare values.
 * @param first An IAsyncParallel<T> whose elements that are not also in second will be returned.
 * @param second An IAsyncParallel<T> whose elements that also occur in the first sequence
 * will cause those elements to be removed from the returned sequence.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns A sequence that contains the set difference of the elements of two sequences.
 */
function exceptAsync(
// eslint-disable-next-line no-shadow
first, second, comparer) {
    const generator = async () => {
        const values = await Promise.all([first.toArray(), second.toArray()]);
        const firstValues = values[0];
        const secondValues = values[1];
        const resultValues = [];
        for (const firstItem of firstValues) {
            let exists = false;
            for (let j = 0; j < secondValues.length; j++) {
                const secondItem = secondValues[j];
                if (await comparer(firstItem, secondItem) === true) {
                    exists = true;
                    break;
                }
            }
            if (exists === false) {
                resultValues.push(firstItem);
            }
        }
        return resultValues;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.exceptAsync = exceptAsync;


/***/ }),

/***/ 8517:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.first = void 0;
const shared_1 = __nccwpck_require__(5897);
const toArray_1 = __nccwpck_require__(2537);
/**
 * Returns the first element of a sequence.
 * If predicate is specified, returns the first element in a sequence that satisfies a specified condition.
 * @param source The IParallelEnumerable<T> to return the first element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The first element in the specified sequence.
 * If predicate is specified,
 * the first element in the sequence that passes the test in the specified predicate function.
 */
function first(source, predicate) {
    if (predicate) {
        return first2(source, predicate);
    }
    else {
        return first1(source);
    }
}
exports.first = first;
const first1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            if (values.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            else {
                return values[0];
            }
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            if (promises.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            else {
                return await promises[0];
            }
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            if (promises.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            else {
                return await promises[0];
            }
        }
    }
};
const first2 = async (source, predicate) => {
    const data = await toArray_1.toArray(source);
    for (const value of data) {
        if (predicate(value) === true) {
            return value;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
};


/***/ }),

/***/ 6270:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const toArray_1 = __nccwpck_require__(2537);
/**
 * Returns the first element in a sequence that satisfies a specified condition.
 * @param source An IParallelEnumerable<T> to return an element from.
 * @param predicate An async function to test each element for a condition.
 * @throws {InvalidOperationException} No elements in Iteration matching predicate
 * @returns The first element in the sequence that passes the test in the specified predicate function.
 */
async function firstAsync(source, predicate) {
    const data = await toArray_1.toArray(source);
    for (const value of data) {
        if (await predicate(value) === true) {
            return value;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
}
exports.firstAsync = firstAsync;


/***/ }),

/***/ 3153:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstOrDefault = void 0;
const toArray_1 = __nccwpck_require__(2537);
/**
 * Returns first element in sequence that satisfies predicate otherwise
 * returns the first element in the sequence. Returns null if no value found.
 * @param source An IParallelEnumerable<T> to return an element from.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The first element in the sequence
 * or the first element that passes the test in the specified predicate function.
 * Returns null if no value found.
 */
function firstOrDefault(source, predicate) {
    if (predicate) {
        return firstOrDefault2(source, predicate);
    }
    else {
        return firstOrDefault1(source);
    }
}
exports.firstOrDefault = firstOrDefault;
const firstOrDefault1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            if (values.length === 0) {
                return null;
            }
            else {
                return values[0];
            }
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            if (promises.length === 0) {
                return null;
            }
            else {
                return await promises[0];
            }
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            if (promises.length === 0) {
                return null;
            }
            else {
                return await promises[0];
            }
        }
    }
};
const firstOrDefault2 = async (source, predicate) => {
    const data = await toArray_1.toArray(source);
    for (const value of data) {
        if (predicate(value) === true) {
            return value;
        }
    }
    return null;
};


/***/ }),

/***/ 1327:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstOrDefaultAsync = void 0;
const toArray_1 = __nccwpck_require__(2537);
/**
 * Returns first element in sequence that satisfies. Returns null if no value found.
 * @param source An IParallelEnumerable<T> to return an element from.
 * @param predicate An async function to test each element for a condition.
 * @returns The first element that passes the test in the specified predicate function.
 * Returns null if no value found.
 */
async function firstOrDefaultAsync(source, predicate) {
    const data = await toArray_1.toArray(source);
    for (const value of data) {
        if (await predicate(value) === true) {
            return value;
        }
    }
    return null;
}
exports.firstOrDefaultAsync = firstOrDefaultAsync;


/***/ }),

/***/ 3589:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupBy = void 0;
const Grouping_1 = __nccwpck_require__(891);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
function groupBy(source, keySelector, comparer) {
    if (comparer) {
        return groupBy_0(source, keySelector, comparer);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return groupBy_0_Simple(source, keySelector);
    }
}
exports.groupBy = groupBy;
function groupBy_0_Simple(source, keySelector) {
    const generator = async () => {
        const keyMap = {};
        for (const value of await source.toArray()) {
            const key = keySelector(value);
            const grouping = keyMap[key]; // TODO
            if (grouping) {
                grouping.push(value);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, value);
            }
        }
        const results = new Array();
        /* eslint-disable guard-for-in */
        for (const value in keyMap) {
            results.push(keyMap[value]);
        }
        /* eslint-enable guard-for-in */
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
function groupBy_0(source, keySelector, comparer) {
    const generator = async () => {
        const keyMap = new Array();
        for (const value of await source.toArray()) {
            const key = keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (comparer(group.key, key)) {
                    group.push(value);
                    found = true;
                    break;
                }
            }
            if (found === false) {
                keyMap.push(new Grouping_1.Grouping(key, value));
            }
        }
        const results = new Array();
        for (const g of keyMap) {
            results.push(g);
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}


/***/ }),

/***/ 2477:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupByAsync = void 0;
const Grouping_1 = __nccwpck_require__(891);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
function groupByAsync(source, keySelector, comparer) {
    if (comparer) {
        return groupByAsync_0(source, keySelector, comparer);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return groupByAsync_0_Simple(source, keySelector);
    }
}
exports.groupByAsync = groupByAsync;
function groupByAsync_0(source, keySelector, comparer) {
    const generator = async () => {
        const keyMap = new Array();
        for await (const value of source) {
            const key = await keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (await comparer(group.key, key) === true) {
                    group.push(value);
                    found = true;
                    break;
                }
            }
            if (found === false) {
                keyMap.push(new Grouping_1.Grouping(key, value));
            }
        }
        const results = new Array();
        for (const g of keyMap) {
            results.push(g);
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
function groupByAsync_0_Simple(source, keySelector) {
    const generator = async () => {
        const keyMap = {};
        for (const value of await source.toArray()) {
            const key = await keySelector(value);
            const grouping = keyMap[key];
            if (grouping) {
                grouping.push(value);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, value);
            }
        }
        const results = new Array();
        /* eslint-disable guard-for-in */
        for (const value in keyMap) {
            results.push(keyMap[value]);
        }
        /* eslint-enable guard-for-in */
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}


/***/ }),

/***/ 6630:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupByWithSel = void 0;
const Grouping_1 = __nccwpck_require__(891);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
function groupByWithSel(source, keySelector, elementSelector, comparer) {
    if (comparer) {
        return groupBy1(source, keySelector, elementSelector, comparer);
    }
    else {
        return groupBy1Simple(source, keySelector, elementSelector);
    }
}
exports.groupByWithSel = groupByWithSel;
const groupBy1 = (source, keySelector, elementSelector, comparer) => {
    const generator = async () => {
        const keyMap = new Array();
        for await (const value of source) {
            const key = keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (comparer(group.key, key)) {
                    group.push(elementSelector(value));
                    found = true;
                    break;
                }
            }
            if (found === false) {
                const element = elementSelector(value);
                keyMap.push(new Grouping_1.Grouping(key, element));
            }
        }
        const results = new Array();
        for (const value of keyMap) {
            results.push(value);
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};
const groupBy1Simple = (source, keySelector, elementSelector) => {
    // generate(): AsyncIterableIterator<IGrouping<string | number, TElement>>
    const generator = async () => {
        const keyMap = {};
        for (const value of await source.toArray()) {
            const key = keySelector(value);
            const grouping = keyMap[key];
            const element = elementSelector(value);
            if (grouping) {
                grouping.push(element);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, element);
            }
        }
        /* eslint-disable guard-for-in */
        const results = new Array();
        for (const value in keyMap) {
            results.push(keyMap[value]);
        }
        /* eslint-enable guard-for-in */
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};


/***/ }),

/***/ 2166:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.intersect = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Produces the set intersection of two sequences by using the specified IEqualityComparer<T> to compare values.
 * If not comparer is specified, uses the @see {StrictEqualityComparer}
 * @param first An IParallelEnumerable<T> whose distinct elements that also appear in second will be returned.
 * @param second An IAsyncParallel<T> whose distinct elements that also appear in the first sequence will be returned.
 * @param comparer An IAsyncEqualityComparer<T> to compare values. Optional.
 * @returns A sequence that contains the elements that form the set intersection of two sequences.
 */
function intersect(
// eslint-disable-next-line no-shadow
first, second, comparer = shared_1.StrictEqualityComparer) {
    const generator = async () => {
        const firstResults = await first.distinct(comparer).toArray();
        if (firstResults.length === 0) {
            return [];
        }
        const secondResults = await second.toArray();
        const results = new Array();
        for (let i = 0; i < firstResults.length; i++) {
            const firstValue = firstResults[i];
            for (let j = 0; j < secondResults.length; j++) {
                const secondValue = secondResults[j];
                if (comparer(firstValue, secondValue) === true) {
                    results.push(firstValue);
                    break;
                }
            }
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.intersect = intersect;


/***/ }),

/***/ 3650:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.intersectAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Produces the set intersection of two sequences by using the specified IAsyncEqualityComparer<T> to compare values.
 * @param first An IParallelEnumerable<T> whose distinct elements that also appear in second will be returned.
 * @param second An IAsyncParallel<T> whose distinct elements that also appear in the first sequence will be returned.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns A sequence that contains the elements that form the set intersection of two sequences.
 */
function intersectAsync(
// eslint-disable-next-line no-shadow
first, second, comparer) {
    const generator = async () => {
        const firstResults = await first.distinctAsync(comparer).toArray();
        if (firstResults.length === 0) {
            return [];
        }
        const secondResults = await second.toArray();
        const results = new Array();
        for (let i = 0; i < firstResults.length; i++) {
            const firstValue = firstResults[i];
            for (let j = 0; j < secondResults.length; j++) {
                const secondValue = secondResults[j];
                if (await comparer(firstValue, secondValue) === true) {
                    results.push(firstValue);
                    break;
                }
            }
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.intersectAsync = intersectAsync;


/***/ }),

/***/ 7048:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.join = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Correlates the elements of two sequences based on matching keys.
 * A specified IEqualityComparer<T> is used to compare keys or the strict equality comparer.
 * @param outer The first sequence to join.
 * @param inner The sequence to join to the first sequence.
 * @param outerKeySelector A function to extract the join key from each element of the first sequence.
 * @param innerKeySelector A function to extract the join key from each element of the second sequence.
 * @param resultSelector A function to create a result element from two matching elements.
 * @param comparer An IEqualityComparer<T> to hash and compare keys. Optional.
 * @returns An IParallelEnumerable<T> that has elements of type TResult that
 * are obtained by performing an inner join on two sequences.
 */
function join(outer, inner, outerKeySelector, innerKeySelector, resultSelector, comparer = shared_1.StrictEqualityComparer) {
    const generator = async () => {
        const innerOuter = await Promise.all([inner.toArray(), outer.toArray()]);
        const innerArray = innerOuter[0];
        const outerArray = innerOuter[1];
        const results = new Array();
        for (const o of outerArray) {
            const outerKey = outerKeySelector(o);
            for (const i of innerArray) {
                const innerKey = innerKeySelector(i);
                if (comparer(outerKey, innerKey) === true) {
                    results.push(resultSelector(o, i));
                }
            }
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.join = join;


/***/ }),

/***/ 815:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.last = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the last element of a sequence.
 * If predicate is specified, the last element of a sequence that satisfies a specified condition.
 * @param source An IParallelEnumerable<T> to return the last element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The value at the last position in the source sequence
 * or the last element in the sequence that passes the test in the specified predicate function.
 */
function last(source, predicate) {
    if (predicate) {
        return last2(source, predicate);
    }
    else {
        return last1(source);
    }
}
exports.last = last;
const last1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            if (values.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            else {
                return values[values.length - 1];
            }
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            if (promises.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            else {
                return await promises[promises.length - 1];
            }
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            if (promises.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            else {
                return await promises[promises.length - 1];
            }
        }
    }
};
const last2 = async (source, predicate) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            // Promise Array - Predicate
            for (let i = values.length - 1; i >= 0; i--) {
                const value = values[i];
                if (predicate(value)) {
                    return value;
                }
            }
            break;
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            // Promise Array - Predicate
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (predicate(value)) {
                    return value;
                }
            }
            break;
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            // Promise Array - Predicate
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (predicate(value)) {
                    return value;
                }
            }
            break;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
};


/***/ }),

/***/ 2145:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the last element of a sequence that satisfies a specified condition.
 * @param source An IParallelEnumerable<T> to return the last element of.
 * @param predicate A function to test each element for a condition.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The last element in the sequence that passes the test in the specified predicate function.
 */
async function lastAsync(source, predicate) {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            // Promise Array - Predicate
            for (let i = values.length - 1; i >= 0; i--) {
                const value = values[i];
                if (await predicate(value) === true) {
                    return value;
                }
            }
            break;
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            // Promise Array - Predicate
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (await predicate(value) === true) {
                    return value;
                }
            }
            break;
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            // Promise Array - Predicate
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (await predicate(value) === true) {
                    return value;
                }
            }
            break;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
}
exports.lastAsync = lastAsync;


/***/ }),

/***/ 7621:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastOrDefault = void 0;
/**
 * Returns the last element of a sequence.
 * If predicate is specified, the last element of a sequence that satisfies a specified condition.
 * @param source An IParallelEnumerable<T> to return the last element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The value at the last position in the source sequence
 * or the last element in the sequence that passes the test in the specified predicate function.
 */
function lastOrDefault(source, predicate) {
    if (predicate) {
        return lastOrDefault2(source, predicate);
    }
    else {
        return lastOrDefault1(source);
    }
}
exports.lastOrDefault = lastOrDefault;
const lastOrDefault1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            if (values.length === 0) {
                return null;
            }
            else {
                return values[values.length - 1];
            }
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            if (promises.length === 0) {
                return null;
            }
            else {
                return await promises[promises.length - 1];
            }
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            if (promises.length === 0) {
                return null;
            }
            else {
                return await promises[promises.length - 1];
            }
        }
    }
};
const lastOrDefault2 = async (source, predicate) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            for (let i = values.length - 1; i >= 0; i--) {
                const value = values[i];
                if (predicate(value)) {
                    return value;
                }
            }
            break;
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (predicate(value)) {
                    return value;
                }
            }
            break;
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (predicate(value)) {
                    return value;
                }
            }
            break;
        }
    }
    return null;
};


/***/ }),

/***/ 1370:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastOrDefaultAsync = void 0;
/**
 * Returns the last element of a sequence that satisfies a specified condition.
 * @param source An IParallelEnumerable<T> to return the last element of.
 * @param predicate A function to test each element for a condition.
 * @returns The last element in the sequence that passes the test in the specified predicate function.
 * Null if no elements.
 */
async function lastOrDefaultAsync(source, predicate) {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const values = await dataFunc.generator();
            for (let i = values.length - 1; i >= 0; i--) {
                const value = values[i];
                if (await predicate(value) === true) {
                    return value;
                }
            }
            break;
        }
        case 1 /* ArrayOfPromises */: {
            const promises = dataFunc.generator();
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (await predicate(value) === true) {
                    return value;
                }
            }
            break;
        }
        case 2 /* PromiseOfPromises */: {
            const promises = await dataFunc.generator();
            for (let i = promises.length - 1; i >= 0; i--) {
                const value = await promises[i];
                if (await predicate(value) === true) {
                    return value;
                }
            }
            break;
        }
    }
    return null;
}
exports.lastOrDefaultAsync = lastOrDefaultAsync;


/***/ }),

/***/ 3661:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.max = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIteration_1 = __nccwpck_require__(9931);
async function max(source, selector) {
    let maxInfo;
    if (selector) {
        const dataFunc = _nextIteration_1.nextIteration(source, selector);
        maxInfo = await new BasicParallelEnumerable_1.BasicParallelEnumerable(dataFunc).toArray();
    }
    else {
        maxInfo = await source.toArray();
    }
    if (maxInfo.length === 0) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return Math.max.apply(null, maxInfo);
}
exports.max = max;


/***/ }),

/***/ 1121:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.maxAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Invokes an async transform function on each element of a sequence and returns the maximum value.
 * @param source A sequence of values to determine the maximum value of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The maximum value in the sequence.
 */
async function maxAsync(source, selector) {
    const dataFunc = _nextIterationAsync_1.nextIterationAsync(source, selector);
    const maxInfo = await new BasicParallelEnumerable_1.BasicParallelEnumerable(dataFunc).toArray();
    if (maxInfo.length === 0) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return Math.max.apply(null, maxInfo);
}
exports.maxAsync = maxAsync;


/***/ }),

/***/ 2299:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.min = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIteration_1 = __nccwpck_require__(9931);
async function min(source, selector) {
    let minInfo;
    if (selector) {
        const dataFunc = _nextIteration_1.nextIteration(source, selector);
        minInfo = await new BasicParallelEnumerable_1.BasicParallelEnumerable(dataFunc)
            .toArray();
    }
    else {
        minInfo = await source.toArray();
    }
    if (minInfo.length === 0) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return Math.min.apply(null, minInfo);
}
exports.min = min;


/***/ }),

/***/ 9111:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.minAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIterationAsync_1 = __nccwpck_require__(1892);
/**
 * Invokes a transform function on each element of a sequence and returns the minimum value.
 * @param source A sequence of values to determine the minimum value of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The minimum value in the sequence.
 */
async function minAsync(source, selector) {
    const dataFunc = _nextIterationAsync_1.nextIterationAsync(source, selector);
    const maxInfo = await new BasicParallelEnumerable_1.BasicParallelEnumerable(dataFunc).toArray();
    if (maxInfo.length === 0) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return Math.min.apply(null, maxInfo);
}
exports.minAsync = minAsync;


/***/ }),

/***/ 2534:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ofType = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Applies a type filter to a source iteration
 * @param source Async Iteration to Filtery by Type
 * @param type Either value for typeof or a consturctor function
 * @returns Values that match the type string or are instance of type
 */
function ofType(source, type) {
    const typeCheck = typeof type === "string" ?
        ((x) => typeof x === type) :
        ((x) => x instanceof type);
    const data = async () => (await source.toArray()).filter(typeCheck);
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator: data,
        type: 0 /* PromiseToArray */,
    });
}
exports.ofType = ofType;


/***/ }),

/***/ 211:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderBy = void 0;
const OrderedParallelEnumerable_1 = __nccwpck_require__(6039);
/**
 * Sorts the elements of a sequence in ascending order by using a specified or default comparer.
 * @param source A sequence of values to order.
 * @param keySelector A function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys. Optional.
 * @returns An IOrderedParallelEnumerable<TElement> whose elements are sorted according to a key.
 */
function orderBy(source, keySelector, comparer) {
    return OrderedParallelEnumerable_1.OrderedParallelEnumerable.generate(source, keySelector, true, comparer);
}
exports.orderBy = orderBy;


/***/ }),

/***/ 8744:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByAsync = void 0;
const OrderedParallelEnumerable_1 = __nccwpck_require__(6039);
/**
 * Sorts the elements of a sequence in ascending order by using a specified comparer.
 * @param source A sequence of values to order.
 * @param keySelector An async function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys.
 * @returns An IOrderedParallelEnumerable<TElement> whose elements are sorted according to a key.
 */
function orderByAsync(source, keySelector, comparer) {
    return OrderedParallelEnumerable_1.OrderedParallelEnumerable.generateAsync(source, keySelector, true, comparer);
}
exports.orderByAsync = orderByAsync;


/***/ }),

/***/ 1268:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByDescending = void 0;
const OrderedParallelEnumerable_1 = __nccwpck_require__(6039);
/**
 * Sorts the elements of a sequence in descending order by using a specified or default comparer.
 * @param source A sequence of values to order.
 * @param keySelector A function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys. Optional.
 * @returns An IOrderedParallelEnumerable<TElement> whose elements are sorted in descending order according to a key.
 */
function orderByDescending(source, keySelector, comparer) {
    return OrderedParallelEnumerable_1.OrderedParallelEnumerable.generate(source, keySelector, false, comparer);
}
exports.orderByDescending = orderByDescending;


/***/ }),

/***/ 8011:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByDescendingAsync = void 0;
const OrderedParallelEnumerable_1 = __nccwpck_require__(6039);
/**
 * Sorts the elements of a sequence in descending order by using a specified comparer.
 * @param source A sequence of values to order.
 * @param keySelector An async function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys.
 * @returns An IOrderedParallelEnumerable<TElement> whose elements are sorted in descending order according to a key.
 */
function orderByDescendingAsync(source, keySelector, comparer) {
    return OrderedParallelEnumerable_1.OrderedParallelEnumerable.generateAsync(source, keySelector, false, comparer);
}
exports.orderByDescendingAsync = orderByDescendingAsync;


/***/ }),

/***/ 9476:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reverse = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Inverts the order of the elements in a sequence.
 * @param source A sequence of values to reverse.
 * @returns A sequence whose elements correspond to those of the input sequence in reverse order.
 */
function reverse(source) {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 1 /* ArrayOfPromises */: {
            const generator = () => {
                return dataFunc.generator().reverse();
            };
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator,
                type: dataFunc.type,
            });
        }
        case 2 /* PromiseOfPromises */: {
            const generator = async () => {
                const array = await dataFunc.generator();
                return array.reverse();
            };
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator,
                type: dataFunc.type,
            });
        }
        case 0 /* PromiseToArray */: {
            const generator = async () => {
                const array = await dataFunc.generator();
                return array.reverse();
            };
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator,
                type: dataFunc.type,
            });
        }
    }
}
exports.reverse = reverse;


/***/ }),

/***/ 1611:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.select = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIteration_1 = __nccwpck_require__(9931);
const _nextIterationWithIndex_1 = __nccwpck_require__(1734);
function select(source, key) {
    if (typeof key === "function") {
        if (key.length === 1) {
            return new BasicParallelEnumerable_1.BasicParallelEnumerable(_nextIteration_1.nextIteration(source, key));
        }
        else {
            return new BasicParallelEnumerable_1.BasicParallelEnumerable(_nextIterationWithIndex_1.nextIterationWithIndex(source, key));
        }
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return new BasicParallelEnumerable_1.BasicParallelEnumerable(_nextIteration_1.nextIteration(source, (x) => x[key]));
    }
}
exports.select = select;


/***/ }),

/***/ 1803:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIterationAsync_1 = __nccwpck_require__(1892);
const _nextIterationWithIndexAsync_1 = __nccwpck_require__(1983);
function selectAsync(source, keyOrSelector) {
    let generator;
    if (typeof keyOrSelector === "function") {
        if (keyOrSelector.length === 1) {
            generator = _nextIterationAsync_1.nextIterationAsync(source, keyOrSelector);
        }
        else {
            generator = _nextIterationWithIndexAsync_1.nextIterationWithIndexAsync(source, keyOrSelector);
        }
    }
    else {
        generator = _nextIterationAsync_1.nextIterationAsync(source, (x) => (x[keyOrSelector]));
    }
    return new BasicParallelEnumerable_1.BasicParallelEnumerable(generator);
}
exports.selectAsync = selectAsync;


/***/ }),

/***/ 2637:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectMany = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIteration_1 = __nccwpck_require__(9931);
const _nextIterationWithIndex_1 = __nccwpck_require__(1734);
function selectMany(source, selector) {
    const generator = async () => {
        let values;
        if (typeof selector === "function") {
            if (selector.length === 1) {
                values = _nextIteration_1.nextIteration(source, selector);
            }
            else {
                values = _nextIterationWithIndex_1.nextIterationWithIndex(source, selector);
            }
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
            values = _nextIteration_1.nextIteration(source, (x) => x[selector]);
        }
        const valuesArray = [];
        switch (values.type) {
            case 0 /* PromiseToArray */: {
                for (const outer of await values.generator()) {
                    for (const y of outer) {
                        valuesArray.push(y);
                    }
                }
                break;
            }
            case 1 /* ArrayOfPromises */: {
                for (const outer of values.generator()) {
                    for (const y of await outer) {
                        valuesArray.push(y);
                    }
                }
                break;
            }
            case 2 /* PromiseOfPromises */: {
                for (const outer of await values.generator()) {
                    for (const y of await outer) {
                        valuesArray.push(y);
                    }
                }
                break;
            }
        }
        return valuesArray;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.selectMany = selectMany;


/***/ }),

/***/ 5961:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectManyAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
const _nextIterationAsync_1 = __nccwpck_require__(1892);
const _nextIterationWithIndexAsync_1 = __nccwpck_require__(1983);
/**
 * Projects each element of a sequence to an IParallelEnumerable<T>
 * and flattens the resulting sequences into one sequence.
 * @param source A sequence of values to project.
 * @param selector A transform function to apply to each element.
 * @returns An IParallelEnumerable<T> whose elements are the result of invoking the
 * one-to-many transform function on each element of the input sequence.
 */
function selectManyAsync(source, selector) {
    const generator = async () => {
        let values;
        if (selector.length === 1) {
            values = _nextIterationAsync_1.nextIterationAsync(source, selector);
        }
        else {
            values = _nextIterationWithIndexAsync_1.nextIterationWithIndexAsync(source, selector);
        }
        const valuesArray = [];
        switch (values.type) {
            case 0 /* PromiseToArray */: {
                for (const outer of await values.generator()) {
                    for (const y of outer) {
                        valuesArray.push(y);
                    }
                }
                break;
            }
            case 1 /* ArrayOfPromises */: {
                for (const outer of values.generator()) {
                    for (const y of await outer) {
                        valuesArray.push(y);
                    }
                }
                break;
            }
            case 2 /* PromiseOfPromises */: {
                for (const outer of await values.generator()) {
                    for (const y of await outer) {
                        valuesArray.push(y);
                    }
                }
                break;
            }
        }
        return valuesArray;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.selectManyAsync = selectManyAsync;


/***/ }),

/***/ 2790:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sequenceEquals = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Compares two parallel sequences to see if they are equal using a comparer function.
 * @param first First Sequence
 * @param second Second Sequence
 * @param comparer Comparer
 * @returns Whether or not the two iterations are equal
 */
async function sequenceEquals(
// eslint-disable-next-line no-shadow
first, second, comparer = shared_1.StrictEqualityComparer) {
    const firstArray = await first.toArray();
    const secondArray = await second.toArray();
    if (firstArray.length !== secondArray.length) {
        return false;
    }
    for (let i = 0; i < firstArray.length; i++) {
        const firstResult = firstArray[i];
        const secondResult = secondArray[i];
        if (comparer(firstResult, secondResult) === false) {
            return false;
        }
    }
    return true;
}
exports.sequenceEquals = sequenceEquals;


/***/ }),

/***/ 3839:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sequenceEqualsAsync = void 0;
/**
 * Compares two parallel iterables to see if they are equal using a async comparer function.
 * @param first First Sequence
 * @param second Second Sequence
 * @param comparer Async Comparer
 * @returns Whether or not the two iterations are equal
 */
async function sequenceEqualsAsync(
// eslint-disable-next-line no-shadow
first, second, comparer) {
    const firstArray = await first.toArray();
    const secondArray = await second.toArray();
    if (firstArray.length !== secondArray.length) {
        return false;
    }
    for (let i = 0; i < firstArray.length; i++) {
        const firstResult = firstArray[i];
        const secondResult = secondArray[i];
        if (await comparer(firstResult, secondResult) === false) {
            return false;
        }
    }
    return true;
}
exports.sequenceEqualsAsync = sequenceEqualsAsync;


/***/ }),

/***/ 9360:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.single = void 0;
const shared_1 = __nccwpck_require__(5897);
const toArray_1 = __nccwpck_require__(2537);
/**
 * Returns the only element of a sequence that satisfies a specified condition (if specified),
 * and throws an exception if more than one such element exists.
 * @param source An IParallelEnumerable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. (Optional)
 * @throws {InvalidOperationException} No element satisfies the condition in predicate. OR
 * More than one element satisfies the condition in predicate. OR
 * The source sequence is empty.
 * @returns The single element of the input sequence that satisfies a condition.
 */
function single(source, predicate) {
    if (predicate) {
        return single2(source, predicate);
    }
    else {
        return single1(source);
    }
}
exports.single = single;
const single1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const results = await dataFunc.generator();
            if (results.length > 1) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else if (results.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            return results[0];
        }
        case 1 /* ArrayOfPromises */: {
            const results = dataFunc.generator();
            if (results.length > 1) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else if (results.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            return results[0];
        }
        case 2 /* PromiseOfPromises */: {
            const results = await dataFunc.generator();
            if (results.length > 1) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else if (results.length === 0) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
            }
            return await results[0];
        }
    }
};
const single2 = async (source, predicate) => {
    const results = await toArray_1.toArray(source);
    let hasValue = false;
    let singleValue = null;
    for (const value of results) {
        if (predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return singleValue;
};


/***/ }),

/***/ 389:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const toArray_1 = __nccwpck_require__(2537);
/**
 * Returns the only element of a sequence that satisfies a specified condition,
 * and throws an exception if more than one such element exists.
 * @param source An IParallelEnumerable<T> to return a single element from.
 * @param predicate A function to test an element for a condition.
 * @throws {InvalidOperationException}
 * No element satisfies the condition in predicate. OR
 * More than one element satisfies the condition in predicate. OR
 * The source sequence is empty.
 * @returns The single element of the input sequence that satisfies a condition.
 */
async function singleAsync(source, predicate) {
    const results = await toArray_1.toArray(source);
    let hasValue = false;
    let singleValue = null;
    for (const value of results) {
        if (await predicate(value) === true) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return singleValue;
}
exports.singleAsync = singleAsync;


/***/ }),

/***/ 6648:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleOrDefault = void 0;
const shared_1 = __nccwpck_require__(5897);
const toArray_1 = __nccwpck_require__(2537);
/**
 * If predicate is specified returns the only element of a sequence that satisfies a specified condition,
 * ootherwise returns the only element of a sequence. Returns a default value if no such element exists.
 * @param source An IParallelEnumerable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. Optional.
 * @throws {InvalidOperationException}
 * If predicate is specified more than one element satisfies the condition in predicate,
 * otherwise the input sequence contains more than one element.
 * @returns The single element of the input sequence that satisfies the condition,
 * or null if no such element is found.
 */
exports.singleOrDefault = (source, predicate) => {
    if (predicate) {
        return singleOrDefault2(source, predicate);
    }
    else {
        return singleOrDefault1(source);
    }
};
const singleOrDefault1 = async (source) => {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const results = await dataFunc.generator();
            if (results.length > 1) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else if (results.length === 0) {
                return null;
            }
            return results[0];
        }
        case 1 /* ArrayOfPromises */: {
            const results = dataFunc.generator();
            if (results.length > 1) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else if (results.length === 0) {
                return null;
            }
            return results[0];
        }
        case 2 /* PromiseOfPromises */: {
            const results = await dataFunc.generator();
            if (results.length > 1) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else if (results.length === 0) {
                return null;
            }
            return await results[0];
        }
    }
};
const singleOrDefault2 = async (source, predicate) => {
    const results = await toArray_1.toArray(source);
    let hasValue = false;
    let singleValue = null;
    for (const value of results) {
        if (predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    return singleValue;
};


/***/ }),

/***/ 3096:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleOrDefaultAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
const toArray_1 = __nccwpck_require__(2537);
/**
 * If predicate is specified returns the only element of a sequence that satisfies a specified condition,
 * ootherwise returns the only element of a sequence. Returns a default value if no such element exists.
 * @param source An IParallelEnumerable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. Optional.
 * @throws {InvalidOperationException}
 * If predicate is specified more than one element satisfies the condition in predicate,
 * otherwise the input sequence contains more than one element.
 * @returns The single element of the input sequence that satisfies the condition,
 * or null if no such element is found.
 */
async function singleOrDefaultAsync(source, predicate) {
    const results = await toArray_1.toArray(source);
    let hasValue = false;
    let singleValue = null;
    for (const value of results) {
        if (await predicate(value) === true) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    return singleValue;
}
exports.singleOrDefaultAsync = singleOrDefaultAsync;


/***/ }),

/***/ 8392:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skip = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
 * @param source An IParallelEnumerable<T> to return elements from.
 * @param count The number of elements to skip before returning the remaining elements.
 * @returns
 * An IParallelEnumerable<T> that contains the elements that occur after the specified index in the input sequence.
 */
function skip(source, count) {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */: {
            const generator = async () => (await dataFunc.generator()).slice(count);
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator,
                type: 0 /* PromiseToArray */,
            });
        }
        case 1 /* ArrayOfPromises */: {
            const generator = () => dataFunc.generator().slice(count);
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator,
                type: 1 /* ArrayOfPromises */,
            });
        }
        case 2 /* PromiseOfPromises */: {
            const generator = async () => {
                const dataInner = await dataFunc.generator();
                return dataInner.slice(count);
            };
            const dataFuncNew = {
                generator,
                type: 2 /* PromiseOfPromises */,
            };
            return new BasicParallelEnumerable_1.BasicParallelEnumerable(dataFuncNew);
        }
    }
}
exports.skip = skip;


/***/ }),

/***/ 9226:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skipWhile = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
 * The element's index is used in the logic of the predicate function.
 * @param source An IAsyncParallel<T> to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IParallelEnumerable<T> that contains the elements from the input sequence starting at the first element
 * in the linear series that does not pass the test specified by predicate.
 */
function skipWhile(source, predicate) {
    const generator = async () => {
        const values = await source.toArray();
        let i = 0;
        for (; i < values.length; i++) {
            const value = values[i];
            if (predicate(value, i) === false) {
                break;
            }
        }
        const returnedValues = [];
        for (; i < values.length; i++) {
            returnedValues.push(values[i]);
        }
        return returnedValues;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.skipWhile = skipWhile;


/***/ }),

/***/ 4057:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skipWhileAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
 * The element's index is used in the logic of the predicate function.
 * @param source An IAsyncParallel<T> to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IParallelEnumerable<T> that contains the elements from the input sequence starting
 * at the first element in the linear series that does not pass the test specified by predicate.
 */
function skipWhileAsync(source, predicate) {
    const generator = async () => {
        const values = await source.toArray();
        let i = 0;
        for (; i < values.length; i++) {
            const value = values[i];
            if (await predicate(value, i) === false) {
                break;
            }
        }
        const returnedValues = [];
        for (; i < values.length; i++) {
            returnedValues.push(values[i]);
        }
        return returnedValues;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.skipWhileAsync = skipWhileAsync;


/***/ }),

/***/ 429:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sum = void 0;
function sum(source, selector) {
    if (selector) {
        return sum2(source, selector);
    }
    else {
        return sum1(source);
    }
}
exports.sum = sum;
const sum1 = async (source) => {
    let totalSum = 0;
    for (const value of await source.toArray()) {
        totalSum += value;
    }
    return totalSum;
};
const sum2 = async (source, selector) => {
    let total = 0;
    for (const value of await source.toArray()) {
        total += selector(value);
    }
    return total;
};


/***/ }),

/***/ 21:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sumAsync = void 0;
/**
 * Computes the sum of the sequence of numeric values that are obtained by invoking a transform function
 * on each element of the input sequence.
 * @param source A sequence of values that are used to calculate a sum.
 * @param selector A transform function to apply to each element.
 * @returns Sum of the sequence
 */
async function sumAsync(source, selector) {
    let total = 0;
    for (const value of await source.toArray()) {
        total += await selector(value);
    }
    return total;
}
exports.sumAsync = sumAsync;


/***/ }),

/***/ 7609:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.take = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Returns a specified number of contiguous elements from the start of a sequence.
 * @param source The sequence to return elements from.
 * @param amount The number of elements to return.
 * @returns An IParallelEnumerable<T> that contains the specified number of elements
 * from the start of the input sequence.
 */
function take(source, amount) {
    const amountLeft = amount > 0 ? amount : 0;
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 1 /* ArrayOfPromises */:
            const generator1 = () => dataFunc.generator().splice(0, amountLeft);
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator: generator1,
                type: 1 /* ArrayOfPromises */,
            });
        case 2 /* PromiseOfPromises */:
            const generator2 = () => dataFunc.generator().then((x) => x.splice(0, amountLeft));
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator: generator2,
                type: 2 /* PromiseOfPromises */,
            });
        case 0 /* PromiseToArray */:
        default:
            const generator3 = () => dataFunc.generator().then((x) => x.splice(0, amountLeft));
            return new BasicParallelEnumerable_1.BasicParallelEnumerable({
                generator: generator3,
                type: 0 /* PromiseToArray */,
            });
    }
}
exports.take = take;


/***/ }),

/***/ 5009:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.takeWhile = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Returns elements from a sequence as long as a specified condition is true.
 * The element's index is used in the logic of the predicate function.
 * @param source The sequence to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence
 * that occur before the element at which the test no longer passes.
 */
function takeWhile(source, predicate) {
    const generator = async () => {
        const values = await source.toArray();
        const results = new Array();
        if (predicate.length === 1) {
            for (const value of values) {
                if (predicate(value) === true) {
                    results.push(value);
                }
                else {
                    break;
                }
            }
        }
        else {
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (predicate(value, i) === true) {
                    results.push(value);
                }
                else {
                    break;
                }
            }
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.takeWhile = takeWhile;


/***/ }),

/***/ 8842:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.takeWhileAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Returns elements from a sequence as long as a specified condition is true.
 * The element's index is used in the logic of the predicate function.
 * @param source The sequence to return elements from.
 * @param predicate An async function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IParallelEnumerable<T> that contains elements
 * from the input sequence that occur before the element at which the test no longer passes.
 */
function takeWhileAsync(source, predicate) {
    const generator = async () => {
        const values = await source.toArray();
        const results = new Array();
        if (predicate.length === 1) {
            const sPredicate = predicate;
            for (const value of values) {
                if (await sPredicate(value) === true) {
                    results.push(value);
                }
                else {
                    break;
                }
            }
        }
        else {
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (await predicate(value, i) === true) {
                    results.push(value);
                }
                else {
                    break;
                }
            }
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.takeWhileAsync = takeWhileAsync;


/***/ }),

/***/ 2537:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toArray = void 0;
/**
 * Creates an array from a IParallelEnumerable<T>.
 * @param source An IParallelEnumerable<T> to create an array from.
 * @returns An array of elements
 */
function toArray(source) {
    const dataFunc = source.dataFunc;
    switch (dataFunc.type) {
        case 0 /* PromiseToArray */:
            return dataFunc.generator();
        case 1 /* ArrayOfPromises */:
            return Promise.all(dataFunc.generator());
        case 2 /* PromiseOfPromises */:
            return (async () => {
                const data = await dataFunc.generator();
                return Promise.all(data);
            })();
        default:
            throw new Error("Not Implemented");
    }
}
exports.toArray = toArray;


/***/ }),

/***/ 2031:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toMap = void 0;
/**
 * Converts an AsyncIterable<V> to a Map<K, V[]>.
 * @param source An Iterable<V> to convert.
 * @param selector A function to serve as a key selector.
 * @returns A promise for Map<K, V[]>
 */
async function toMap(source, selector) {
    const map = new Map();
    for await (const value of source) {
        const key = selector(value);
        const array = map.get(key);
        if (array === undefined) {
            map.set(key, [value]);
        }
        else {
            array.push(value);
        }
    }
    return map;
}
exports.toMap = toMap;


/***/ }),

/***/ 3037:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toMapAsync = void 0;
/**
 * Converts an AsyncIterable<V> to a Map<K, V[]>.
 * @param source An Iterable<V> to convert.
 * @param selector An async function to serve as a key selector.
 * @returns A promise for Map<K, V[]>
 */
async function toMapAsync(source, selector) {
    const map = new Map();
    for await (const value of source) {
        const key = await selector(value);
        const array = map.get(key);
        if (array === undefined) {
            map.set(key, [value]);
        }
        else {
            array.push(value);
        }
    }
    return map;
}
exports.toMapAsync = toMapAsync;


/***/ }),

/***/ 9632:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toSet = void 0;
/**
 * Converts the Async Itertion to a Set
 * @param source Iteration
 * @returns Set containing the iteration values
 */
async function toSet(source) {
    const set = new Set();
    for await (const item of source) {
        set.add(item);
    }
    return set;
}
exports.toSet = toSet;


/***/ }),

/***/ 3615:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.union = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Produces the set union of two sequences by using scrict equality comparison or a specified IEqualityComparer<T>.
 * @param first An IAsyncParallel<T> whose distinct elements form the first set for the union.
 * @param second An IAsyncParallel<T> whose distinct elements form the second set for the union.
 * @param comparer The IEqualityComparer<T> to compare values. Optional.
 * @returns An IParallelEnumerable<T> that contains the elements from both input sequences, excluding duplicates.
 */
function union(first, second, comparer) {
    if (comparer) {
        return union2(first, second, comparer);
    }
    else {
        return union1(first, second);
    }
}
exports.union = union;
const union1 = (first, second) => {
    async function generator() {
        const set = new Set();
        const secondPromise = second.toArray();
        for await (const item of first) {
            if (set.has(item) === false) {
                set.add(item);
            }
        }
        const secondValues = await secondPromise;
        for (const item of secondValues) {
            if (set.has(item) === false) {
                set.add(item);
            }
        }
        return [...set.keys()];
    }
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};
const union2 = (
// eslint-disable-next-line no-shadow
first, second, comparer) => {
    const generator = async () => {
        const result = [];
        const values = await Promise.all([first.toArray(), second.toArray()]);
        for (const source of values) {
            for (const value of source) {
                let exists = false;
                for (const resultValue of result) {
                    if (comparer(value, resultValue) === true) {
                        exists = true;
                        break;
                    }
                }
                if (exists === false) {
                    result.push(value);
                }
            }
        }
        return result;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};


/***/ }),

/***/ 5945:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unionAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Produces the set union of two sequences by using a specified IAsyncEqualityComparer<T>.
 * @param first An AsyncIterable<T> whose distinct elements form the first set for the union.
 * @param second An AsyncIterable<T> whose distinct elements form the second set for the union.
 * @param comparer The IAsyncEqualityComparer<T> to compare values.
 * @returns An IAsyncEnumerable<T> that contains the elements from both input sequences, excluding duplicates.
 */
function unionAsync(
// eslint-disable-next-line no-shadow
first, second, comparer) {
    const generator = async () => {
        const result = [];
        const values = await Promise.all([first.toArray(), second.toArray()]);
        for (const source of values) {
            for (const value of source) {
                let exists = false;
                for (const resultValue of result) {
                    if (await comparer(value, resultValue) === true) {
                        exists = true;
                        break;
                    }
                }
                if (exists === false) {
                    result.push(value);
                }
            }
        }
        return result;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.unionAsync = unionAsync;


/***/ }),

/***/ 719:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.where = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Filters a sequence of values based on a predicate.
 * Each element's index is used in the logic of the predicate function.
 * @param source An IAsyncParallel<T> to filter.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IParallelEnumerable<T> that contains elements from the input sequence that satisfy the condition.
 */
function where(source, predicate) {
    const generator = async () => {
        const values = await source.toArray();
        return values.filter(predicate);
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.where = where;


/***/ }),

/***/ 6742:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.whereAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Filters a sequence of values based on a predicate.
 * Each element's index is used in the logic of the predicate function.
 * @param source An IAsyncParallel<T> to filter.
 * @param predicate A async function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IParallelEnumerable<T> that contains elements from the input sequence that satisfy the condition.
 */
function whereAsync(source, predicate) {
    const generator = async () => {
        const values = await source.toArray();
        const valuesAsync = values.map(async (x, i) => {
            const keep = await predicate(x, i);
            return {
                keep,
                x,
            };
        });
        const filteredValues = [];
        for (const value of await Promise.all(valuesAsync)) {
            if (value.keep) {
                filteredValues.push(value.x);
            }
        }
        return filteredValues;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.whereAsync = whereAsync;


/***/ }),

/***/ 8763:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.zip = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
function zip(first, second, resultSelector) {
    if (resultSelector) {
        return zip2(first, second, resultSelector);
    }
    else {
        return zip1(first, second);
    }
}
exports.zip = zip;
const zip1 = (source, second) => {
    async function generator() {
        const [left, right] = await Promise.all([source.toArray(), second.toArray()]);
        const maxLength = left.length > right.length ? left.length : right.length;
        const results = new Array(maxLength);
        for (let i = 0; i < maxLength; i++) {
            const a = left[i];
            const b = right[i];
            results[i] = [a, b];
        }
        return results;
    }
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};
const zip2 = (source, second, resultSelector) => {
    async function generator() {
        const [left, right] = await Promise.all([source.toArray(), second.toArray()]);
        const maxLength = left.length > right.length ? left.length : right.length;
        const results = new Array(maxLength);
        for (let i = 0; i < maxLength; i++) {
            const a = left[i];
            const b = right[i];
            results[i] = resultSelector(a, b);
        }
        return results;
    }
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};


/***/ }),

/***/ 669:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.zipAsync = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Applies a specified async function to the corresponding elements of two sequences,
 * producing a sequence of the results.
 * @param first The first sequence to merge.
 * @param second The second sequence to merge.
 * @param resultSelector An async function that specifies how to merge the elements from the two sequences.
 * @returns An IAsyncEnumerable<T> that contains merged elements of two input sequences.
 */
function zipAsync(first, second, resultSelector) {
    async function generator() {
        const [left, right] = await Promise.all([first.toArray(), second.toArray()]);
        const maxLength = left.length > right.length ? left.length : right.length;
        const resultPromises = new Array(maxLength);
        for (let i = 0; i < maxLength; i++) {
            const a = left[i];
            const b = right[i];
            resultPromises[i] = resultSelector(a, b);
        }
        return Promise.all(resultPromises);
    }
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.zipAsync = zipAsync;


/***/ }),

/***/ 9475:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isParallelEnumerable = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
/**
 * Determine if the source is IParallelEnumerable
 * @param source Any value
 * @returns Whether or not this type is a Parallel Enumerable
 */
exports.isParallelEnumerable = (source) => {
    if (!source) {
        return false;
    }
    if (source instanceof BasicParallelEnumerable_1.BasicParallelEnumerable) {
        return true;
    }
    if (typeof source[Symbol.asyncIterator] !== "function") {
        return false;
    }
    const propertyNames = Object.getOwnPropertyNames(BasicParallelEnumerable_1.BasicParallelEnumerable.prototype)
        .filter((v) => v !== "constructor");
    const methods = source.prototype || source;
    for (const prop of propertyNames) {
        if (typeof methods[prop] !== "function") {
            return false;
        }
    }
    return true;
};


/***/ }),

/***/ 1942:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.emptyParallel = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Returns an empty IParallelEnumerable<T> that has the specified type argument.
 * @returns An empty IParallelEnumerable<T> whose type argument is TResult.
 */
exports.emptyParallel = () => {
    const dataFunc = {
        generator: async () => [],
        type: 0 /* PromiseToArray */,
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable(dataFunc);
};


/***/ }),

/***/ 7457:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.flattenParallel = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
function flattenParallel(source, shallow) {
    async function* iterator(sourceInner) {
        for await (const item of sourceInner) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (item[Symbol.asyncIterator] !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const items = shallow ? item : iterator(item);
                for await (const inner of items) {
                    yield inner;
                }
            }
            else {
                yield item;
            }
        }
    }
    const generator = async () => {
        const results = [];
        for await (const x of iterator(source)) {
            results.push(x);
        }
        return results;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
}
exports.flattenParallel = flattenParallel;


/***/ }),

/***/ 3709:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fromParallel = void 0;
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
function fromParallel(type, generator) {
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        type,
    });
}
exports.fromParallel = fromParallel;


/***/ }),

/***/ 8485:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var emptyParallel_1 = __nccwpck_require__(1942);
Object.defineProperty(exports, "emptyParallel", ({ enumerable: true, get: function () { return emptyParallel_1.emptyParallel; } }));
var flattenParallel_1 = __nccwpck_require__(7457);
Object.defineProperty(exports, "flattenParallel", ({ enumerable: true, get: function () { return flattenParallel_1.flattenParallel; } }));
var fromParallel_1 = __nccwpck_require__(3709);
Object.defineProperty(exports, "fromParallel", ({ enumerable: true, get: function () { return fromParallel_1.fromParallel; } }));
var partitionParallel_1 = __nccwpck_require__(1808);
Object.defineProperty(exports, "partitionParallel", ({ enumerable: true, get: function () { return partitionParallel_1.partitionParallel; } }));
var rangeParallel_1 = __nccwpck_require__(3012);
Object.defineProperty(exports, "rangeParallel", ({ enumerable: true, get: function () { return rangeParallel_1.rangeParallel; } }));
var repeatParallel_1 = __nccwpck_require__(5539);
Object.defineProperty(exports, "repeatParallel", ({ enumerable: true, get: function () { return repeatParallel_1.repeatParallel; } }));


/***/ }),

/***/ 1808:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.partitionParallel = void 0;
/**
 * Paritions the Iterable<T> into a tuple of failing and passing arrays
 * based on the predicate.
 * @param source Elements to Partition
 * @param predicate Pass / Fail condition
 * @returns [pass, fail]
 */
exports.partitionParallel = async (source, predicate) => {
    const fail = [];
    const pass = [];
    for await (const value of source) {
        if (predicate(value) === true) {
            pass.push(value);
        }
        else {
            fail.push(value);
        }
    }
    return [pass, fail];
};


/***/ }),

/***/ 3012:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.rangeParallel = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Generates a sequence of integral numbers within a specified range.
 * @param start The value of the first integer in the sequence.
 * @param count The number of sequential integers to generate.
 * @throws {ArgumentOutOfRangeException} Start is Less than 0
 * OR start + count -1 is larger than MAX_SAFE_INTEGER.
 * @returns An IParallelEnumerable<number> that contains a range of sequential integral numbers.
 */
function rangeParallel(start, count) {
    if (start < 0 || (start + count - 1) > Number.MAX_SAFE_INTEGER) {
        throw new shared_1.ArgumentOutOfRangeException(`start`);
    }
    function generator() {
        const items = [];
        const maxI = start + count;
        for (let i = start; i < maxI; i++) {
            items.push(Promise.resolve(i));
        }
        return items;
    }
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 1 /* ArrayOfPromises */,
    });
}
exports.rangeParallel = rangeParallel;


/***/ }),

/***/ 5539:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.repeatParallel = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicParallelEnumerable_1 = __nccwpck_require__(6716);
/**
 * Generates a sequence that contains one repeated value.
 * @param element The value to be repeated.
 * @param count The number of times to repeat the value in the generated sequence.
 * @param delay Miliseconds for Timeout
 * @returns An IParallelEnumerable<T> that contains a repeated value.
 */
function repeatParallel(
// eslint-disable-next-line no-shadow
element, count, delay) {
    if (count < 0) {
        throw new shared_1.ArgumentOutOfRangeException(`count`);
    }
    if (delay) {
        return repeat2(element, count, delay);
    }
    else {
        return repeat1(element, count);
    }
}
exports.repeatParallel = repeatParallel;
const repeat1 = (element, count) => {
    const generator = async () => {
        const values = new Array(count);
        for (let i = 0; i < count; i++) {
            values[i] = element;
        }
        return values;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 0 /* PromiseToArray */,
    });
};
const repeat2 = (element, count, delay) => {
    const generator = async () => {
        const values = new Array(count);
        for (let i = 0; i < count; i++) {
            values[i] = new Promise((resolve) => setTimeout(() => resolve(element), delay));
        }
        return values;
    };
    return new BasicParallelEnumerable_1.BasicParallelEnumerable({
        generator,
        type: 2 /* PromiseOfPromises */,
    });
};


/***/ }),

/***/ 5713:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArgumentOutOfRangeException = void 0;
/**
 * Exception thrown when the passed in argument
 * is out of range.
 */
class ArgumentOutOfRangeException extends RangeError {
    constructor(paramName) {
        super(`${paramName} was out of range.` +
            ` Must be non-negative and less than the size of the collection.`);
        this.paramName = paramName;
        this.name = `ArgumentOutOfRangeException`;
        this.stack = this.stack || (new Error()).stack;
    }
}
exports.ArgumentOutOfRangeException = ArgumentOutOfRangeException;


/***/ }),

/***/ 3408:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EqualityComparer = void 0;
/**
 * Does weak (==) comparison between two values.
 * Good for comparing numbers and strings.
 * @param x left value
 * @param y right value
 * @returns x == y
 */
exports.EqualityComparer = (x, y) => 
// eslint-disable-next-line eqeqeq
x == y;


/***/ }),

/***/ 3206:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ErrorString = void 0;
/**
 * @private
 */
exports.ErrorString = Object.freeze({
    MoreThanOneElement: `Sequence contains more than one element`,
    MoreThanOneMatchingElement: `Sequence contains more than one matching element`,
    NoElements: `Sequence contains no elements`,
    NoMatch: `Sequence contains no matching element`,
});


/***/ }),

/***/ 9980:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InvalidOperationException = void 0;
/**
 * Invalid Operation Exception
 */
class InvalidOperationException extends Error {
    constructor(message) {
        super(message);
        this.name = `InvalidOperationException`;
        this.stack = this.stack || (new Error()).stack;
    }
}
exports.InvalidOperationException = InvalidOperationException;


/***/ }),

/***/ 7362:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NumberComparer = void 0;
/**
 * Compares two numeric values.
 * @param x left value
 * @param y right value
 * @returns x - y
 */
exports.NumberComparer = (x, y) => x - y;


/***/ }),

/***/ 951:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StrictEqualityComparer = void 0;
/**
 * Does strict (===) comparison between two values.
 * @param x left value
 * @param y right value
 * @returns Whether or not the two values are strictly equal
 */
exports.StrictEqualityComparer = (x, y) => x === y;


/***/ }),

/***/ 7786:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StringifyComparer = void 0;
/**
 * Compares two values by converting them to json
 * and then comparing the two json strings.
 * @param x left value
 * @param y right value
 * @returns Whether or not the two values produce equal JSON
 */
exports.StringifyComparer = (x, y) => JSON.stringify(x) === JSON.stringify(y);


/***/ }),

/***/ 5897:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ArgumentOutOfRangeException_1 = __nccwpck_require__(5713);
Object.defineProperty(exports, "ArgumentOutOfRangeException", ({ enumerable: true, get: function () { return ArgumentOutOfRangeException_1.ArgumentOutOfRangeException; } }));
var EqualityComparer_1 = __nccwpck_require__(3408);
Object.defineProperty(exports, "EqualityComparer", ({ enumerable: true, get: function () { return EqualityComparer_1.EqualityComparer; } }));
var ErrorString_1 = __nccwpck_require__(3206);
Object.defineProperty(exports, "ErrorString", ({ enumerable: true, get: function () { return ErrorString_1.ErrorString; } }));
var InvalidOperationException_1 = __nccwpck_require__(9980);
Object.defineProperty(exports, "InvalidOperationException", ({ enumerable: true, get: function () { return InvalidOperationException_1.InvalidOperationException; } }));
var NumberComparer_1 = __nccwpck_require__(7362);
Object.defineProperty(exports, "NumberComparer", ({ enumerable: true, get: function () { return NumberComparer_1.NumberComparer; } }));
var StrictEqualityComparer_1 = __nccwpck_require__(951);
Object.defineProperty(exports, "StrictEqualityComparer", ({ enumerable: true, get: function () { return StrictEqualityComparer_1.StrictEqualityComparer; } }));
var StringifyComparer_1 = __nccwpck_require__(7786);
Object.defineProperty(exports, "StringifyComparer", ({ enumerable: true, get: function () { return StringifyComparer_1.StringifyComparer; } }));


/***/ }),

/***/ 8640:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArrayEnumerable = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Array backed Enumerable
 */
class ArrayEnumerable extends Array {
}
exports.ArrayEnumerable = ArrayEnumerable;


/***/ }),

/***/ 3706:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BasicEnumerable = void 0;
/* eslint-disable @typescript-eslint/no-empty-interface */
/**
 * Basic Enumerable. Usually returned from the Enumerable class.
 * @private
 */
class BasicEnumerable {
    constructor(iterator) {
        this.iterator = iterator;
        //
    }
    [Symbol.iterator]() {
        return this.iterator();
    }
}
exports.BasicEnumerable = BasicEnumerable;


/***/ }),

/***/ 891:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Grouping = void 0;
const ArrayEnumerable_1 = __nccwpck_require__(8640);
/**
 * Key to Values Enumeration
 * @private
 */
class Grouping extends ArrayEnumerable_1.ArrayEnumerable {
    constructor(key, startingItem) {
        super(1);
        this.key = key;
        this[0] = startingItem;
    }
}
exports.Grouping = Grouping;


/***/ }),

/***/ 8249:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrderedEnumerable = void 0;
const OrderedAsyncEnumerable_1 = __nccwpck_require__(2485);
const asSortedKeyValues_1 = __nccwpck_require__(4153);
const asSortedKeyValuesAsync_1 = __nccwpck_require__(8767);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Represents Ordered Enumeration
 * @private
 */
class OrderedEnumerable extends BasicEnumerable_1.BasicEnumerable {
    constructor(orderedPairs) {
        super(function* () {
            for (const orderedPair of orderedPairs()) {
                yield* orderedPair;
            }
        });
        this.orderedPairs = orderedPairs;
    }
    // #region Sync
    static generate(source, keySelector, ascending, comparer) {
        let orderedPairs;
        if (source instanceof OrderedEnumerable) {
            orderedPairs = function* () {
                for (const pair of source.orderedPairs()) {
                    yield* asSortedKeyValues_1.asSortedKeyValues(pair, keySelector, ascending, comparer);
                }
            };
        }
        else {
            orderedPairs = () => asSortedKeyValues_1.asSortedKeyValues(source, keySelector, ascending, comparer);
        }
        return new OrderedEnumerable(orderedPairs);
    }
    // #endregion
    // #region Async
    static generateAsync(source, keySelector, ascending, comparer) {
        let orderedPairs;
        if (source instanceof OrderedEnumerable) {
            orderedPairs = async function* () {
                for (const pair of source.orderedPairs()) {
                    yield* asSortedKeyValuesAsync_1.asSortedKeyValuesAsync(pair, keySelector, ascending, comparer);
                }
            };
        }
        else {
            orderedPairs = () => asSortedKeyValuesAsync_1.asSortedKeyValuesAsync(source, keySelector, ascending, comparer);
        }
        return new OrderedAsyncEnumerable_1.OrderedAsyncEnumerable(orderedPairs);
    }
    // #endregion
    thenBy(keySelector, comparer) {
        return OrderedEnumerable.generate(this, keySelector, true, comparer);
    }
    thenByAsync(keySelector, comparer) {
        return OrderedEnumerable.generateAsync(this, keySelector, true, comparer);
    }
    thenByDescending(keySelector, comparer) {
        return OrderedEnumerable.generate(this, keySelector, false, comparer);
    }
    thenByDescendingAsync(keySelector, comparer) {
        return OrderedEnumerable.generateAsync(this, keySelector, false, comparer);
    }
}
exports.OrderedEnumerable = OrderedEnumerable;


/***/ }),

/***/ 3492:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asKeyMap = void 0;
/**
 * Converts values to a key values map.
 * @param source Iterable
 * @param keySelector Key Selector for Map
 * @returns Map for Key to Values
 */
exports.asKeyMap = (source, keySelector) => {
    const map = new Map();
    for (const item of source) {
        const key = keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 7252:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asKeyMapAsync = void 0;
/**
 * Converts values to a key values map.
 * @param source Iterable
 * @param keySelector Async Key Selector for Map
 * @returns Map for Key to Values
 */
exports.asKeyMapAsync = async (source, keySelector) => {
    const map = new Map();
    for (const item of source) {
        const key = await keySelector(item);
        const currentMapping = map.get(key);
        if (currentMapping) {
            currentMapping.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
};


/***/ }),

/***/ 4153:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asSortedKeyValues = void 0;
const asKeyMap_1 = __nccwpck_require__(3492);
/**
 * Sorts values in an Iterable based on key and a key comparer.
 * @param source Iterable
 * @param keySelector Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 */
function* asSortedKeyValues(source, keySelector, ascending, comparer) {
    const map = asKeyMap_1.asKeyMap(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asSortedKeyValues = asSortedKeyValues;


/***/ }),

/***/ 8767:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asSortedKeyValuesAsync = void 0;
const asKeyMapAsync_1 = __nccwpck_require__(7252);
/**
 * Sorts values in an Iterable based on key and a key comparer.
 * @param source Iterable
 * @param keySelector Async Key Selector
 * @param ascending Ascending or Descending Sort
 * @param comparer Key Comparer for Sorting. Optional.
 * @returns Async Iterable Iterator
 */
async function* asSortedKeyValuesAsync(source, keySelector, ascending, comparer) {
    const map = await asKeyMapAsync_1.asKeyMapAsync(source, keySelector);
    const sortedKeys = [...map.keys()].sort(comparer ? comparer : undefined);
    if (ascending) {
        for (let i = 0; i < sortedKeys.length; i++) {
            yield map.get(sortedKeys[i]);
        }
    }
    else {
        for (let i = sortedKeys.length - 1; i >= 0; i--) {
            yield map.get(sortedKeys[i]);
        }
    }
}
exports.asSortedKeyValuesAsync = asSortedKeyValuesAsync;


/***/ }),

/***/ 3880:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.aggregate = void 0;
const shared_1 = __nccwpck_require__(5897);
function aggregate(source, seedOrFunc, func, resultSelector) {
    if (resultSelector) {
        if (!func) {
            throw new ReferenceError(`TAccumulate function is undefined`);
        }
        return aggregate3(source, seedOrFunc, func, resultSelector);
    }
    else if (func) {
        return aggregate2(source, seedOrFunc, func);
    }
    else {
        return aggregate1(source, seedOrFunc);
    }
}
exports.aggregate = aggregate;
const aggregate1 = (source, func) => {
    let aggregateValue;
    for (const value of source) {
        if (aggregateValue) {
            aggregateValue = func(aggregateValue, value);
        }
        else {
            aggregateValue = value;
        }
    }
    if (aggregateValue === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return aggregateValue;
};
const aggregate2 = (source, seed, func) => {
    let aggregateValue = seed;
    for (const value of source) {
        aggregateValue = func(aggregateValue, value);
    }
    return aggregateValue;
};
const aggregate3 = (source, seed, func, resultSelector) => {
    let aggregateValue = seed;
    for (const value of source) {
        aggregateValue = func(aggregateValue, value);
    }
    return resultSelector(aggregateValue);
};


/***/ }),

/***/ 6504:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.all = void 0;
/**
 * Determines whether all elements of a sequence satisfy a condition.
 * @param source An Iterable<T> that contains the elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
exports.all = (source, predicate) => {
    for (const item of source) {
        if (predicate(item) === false) {
            return false;
        }
    }
    return true;
};


/***/ }),

/***/ 7664:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.allAsync = void 0;
/**
 * Determines whether all elements of a sequence satisfy a condition.
 * @param source An Iterable<T> that contains the elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns ``true`` if every element of the source sequence passes the test in the specified predicate,
 * or if the sequence is empty; otherwise, ``false``.
 */
exports.allAsync = async (source, predicate) => {
    for (const item of source) {
        if (await predicate(item) === false) {
            return false;
        }
    }
    return true;
};


/***/ }),

/***/ 6666:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.any = void 0;
/**
 * Determines whether a sequence contains any elements.
 * If predicate is specified, determines whether any element of a sequence satisfies a condition.
 * @param source The Iterable<T> to check for emptiness or apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns true if the source sequence contains any elements or passes the test specified; otherwise, false.
 */
exports.any = (source, predicate) => {
    if (predicate) {
        return any2(source, predicate);
    }
    else {
        return any1(source);
    }
};
const any1 = (source) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of source) {
        return true;
    }
    return false;
};
const any2 = (source, predicate) => {
    for (const item of source) {
        if (predicate(item) === true) {
            return true;
        }
    }
    return false;
};


/***/ }),

/***/ 7462:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.anyAsync = void 0;
/**
 * Determines whether any element of a sequence satisfies a condition.
 * @param source An IEnumerable<T> whose elements to apply the predicate to.
 * @param predicate A function to test each element for a condition.
 * @returns true if the source sequence contains any elements or passes the test specified; otherwise, false.
 */
exports.anyAsync = async (source, predicate) => {
    for (const item of source) {
        if (await predicate(item) === true) {
            return true;
        }
    }
    return false;
};


/***/ }),

/***/ 7662:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Converts the iterable to an @see {IAsyncEnumerable}
 * @param source The Iterable<T> to convert
 * @returns An IAsyncEnumerable<T>
 */
exports.asAsync = (source) => {
    async function* generator() {
        for (const value of source) {
            yield value;
        }
    }
    return fromAsync_1.fromAsync(generator);
};


/***/ }),

/***/ 2035:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.asParallel = void 0;
const fromParallel_1 = __nccwpck_require__(3709);
/**
 * Converts an iterable to @see {IParallelEnumerable}
 * @param source Sequence to convert
 * @returns An IParallelEnumerable<T>
 */
exports.asParallel = (source) => {
    const generator = async () => {
        const array = [];
        for (const value of source) {
            array.push(value);
        }
        return array;
    };
    return fromParallel_1.fromParallel(0 /* PromiseToArray */, generator);
};


/***/ }),

/***/ 758:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.average = void 0;
const shared_1 = __nccwpck_require__(5897);
function average(source, selector) {
    if (selector) {
        return average2(source, selector);
    }
    else {
        return average1(source);
    }
}
exports.average = average;
const average1 = (source) => {
    let value;
    let count;
    for (const item of source) {
        value = (value || 0) + item;
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};
const average2 = (source, func) => {
    let value;
    let count;
    for (const item of source) {
        value = (value || 0) + func(item);
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};


/***/ }),

/***/ 9013:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.averageAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Computes the average of a sequence of values
 * that are obtained by invoking a transform function on each element of the input sequence.
 * @param source A sequence of values to calculate the average of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns Avarage of the sequence of values
 */
exports.averageAsync = async (source, selector) => {
    let value;
    let count;
    for (const item of source) {
        value = (value || 0) + await selector(item);
        count = (count || 0) + 1;
    }
    if (value === undefined) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return value / count;
};


/***/ }),

/***/ 323:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.concatenate = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Concatenates two sequences.
 * @param first The first sequence to concatenate.
 * @param second The sequence to concatenate to the first sequence.
 * @returns An IEnumerable<T> that contains the concatenated elements of the two input sequences.
 */
exports.concatenate = (first, second) => {
    function* iterator() {
        yield* first;
        yield* second;
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 6805:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contains = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Determines whether a sequence contains a specified element by using the specified or default IEqualityComparer<T>.
 * @param source A sequence in which to locate a value.
 * @param value The value to locate in the sequence.
 * @param comparer An equality comparer to compare values. Optional.
 * @returns true if the source sequence contains an element that has the specified value; otherwise, false.
 */
exports.contains = (source, value, comparer = shared_1.StrictEqualityComparer) => {
    for (const item of source) {
        if (comparer(value, item)) {
            return true;
        }
    }
    return false;
};


/***/ }),

/***/ 8261:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.containsAsync = void 0;
/**
 * Determines whether a sequence contains a specified element by using the specified or default IEqualityComparer<T>.
 * @param source A sequence in which to locate a value.
 * @param value The value to locate in the sequence.
 * @param comparer An equality comparer to compare values. Optional.
 * @returns true if the source sequence contains an element that has the specified value; otherwise, false.
 */
exports.containsAsync = async (source, value, comparer) => {
    for (const item of source) {
        if (await comparer(value, item)) {
            return true;
        }
    }
    return false;
};


/***/ }),

/***/ 6333:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.count = void 0;
/**
 * Returns the number of elements in a sequence
 * or represents how many elements in the specified sequence satisfy a condition
 * if the predicate is specified.
 * @param source A sequence that contains elements to be counted.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The number of elements in the input sequence.
 */
exports.count = (source, predicate) => {
    if (predicate) {
        return count2(source, predicate);
    }
    else {
        return count1(source);
    }
};
const count1 = (source) => {
    // eslint-disable-next-line no-shadow
    let count = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of source) {
        count++;
    }
    return count;
};
const count2 = (source, predicate) => {
    // eslint-disable-next-line no-shadow
    let count = 0;
    for (const value of source) {
        if (predicate(value) === true) {
            count++;
        }
    }
    return count;
};


/***/ }),

/***/ 7872:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.countAsync = void 0;
/**
 * Returns the number of elements in a sequence
 * or represents how many elements in the specified sequence satisfy a condition
 * if the predicate is specified.
 * @param source A sequence that contains elements to be counted.
 * @param predicate A function to test each element for a condition.
 * @returns The number of elements in the input sequence.
 */
exports.countAsync = async (source, predicate) => {
    let count = 0;
    for (const value of source) {
        if (await predicate(value) === true) {
            count++;
        }
    }
    return count;
};


/***/ }),

/***/ 5605:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.distinct = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Returns distinct elements from a sequence by using the default or specified equality comparer to compare values.
 * @param source The sequence to remove duplicate elements from.
 * @param comparer An IEqualityComparer<T> to compare values. Optional. Defaults to Strict Equality Comparison.
 * @returns An IEnumerable<T> that contains distinct elements from the source sequence.
 */
exports.distinct = (source, comparer = shared_1.StrictEqualityComparer) => {
    function* iterator() {
        const distinctElements = [];
        for (const item of source) {
            const foundItem = distinctElements.find((x) => comparer(x, item));
            if (!foundItem) {
                distinctElements.push(item);
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 4770:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.distinctAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Returns distinct elements from a sequence by using the specified equality comparer to compare values.
 * @param source The sequence to remove duplicate elements from.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns An IAsyncEnumerable<T> that contains distinct elements from the source sequence.
 */
exports.distinctAsync = (source, comparer) => {
    async function* iterator() {
        const distinctElements = [];
        outerLoop: for (const item of source) {
            for (const distinctElement of distinctElements) {
                const found = await comparer(distinctElement, item);
                if (found) {
                    continue outerLoop;
                }
            }
            distinctElements.push(item);
            yield item;
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 679:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.each = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Performs a specified action on each element of the Iterable<TSource>
 * @param source The source to iterate
 * @param action The action to take an each element
 * @returns A new IEnumerable<T> that executes the action lazily as you iterate.
 */
exports.each = (source, action) => {
    function* generator() {
        for (const value of source) {
            action(value);
            yield value;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(generator);
};


/***/ }),

/***/ 6256:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.eachAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Performs a specified action on each element of the Iterable<TSource>
 * @param source The source to iterate
 * @param action The action to take an each element
 * @returns A new IAsyncEnumerable<T> that executes the action lazily as you iterate.
 */
exports.eachAsync = (source, action) => {
    async function* generator() {
        for (const value of source) {
            await action(value);
            yield value;
        }
    }
    return fromAsync_1.fromAsync(generator);
};


/***/ }),

/***/ 3281:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elementAt = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the element at a specified index in a sequence.
 * @param source An IEnumerable<T> to return an element from.
 * @param index The zero-based index of the element to retrieve.
 * @throws {ArgumentOutOfRangeException}
 * index is less than 0 or greater than or equal to the number of elements in source.
 * @returns The element at the specified position in the source sequence.
 */
exports.elementAt = (source, index) => {
    if (index < 0) {
        throw new shared_1.ArgumentOutOfRangeException("index");
    }
    let i = 0;
    for (const item of source) {
        if (index === i++) {
            return item;
        }
    }
    throw new shared_1.ArgumentOutOfRangeException("index");
};


/***/ }),

/***/ 6643:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.elementAtOrDefault = void 0;
/**
 * Returns the element at a specified index in a sequence or a default value if the index is out of range.
 * @param source An IEnumerable<T> to return an element from.
 * @param index The zero-based index of the element to retrieve.
 * @returns
 * null if the index is outside the bounds of the source sequence;
 * otherwise, the element at the specified position in the source sequence.
 */
exports.elementAtOrDefault = (source, index) => {
    let i = 0;
    for (const item of source) {
        if (index === i++) {
            return item;
        }
    }
    return null;
};


/***/ }),

/***/ 1213:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.except = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Produces the set difference of two sequences by using the comparer provided
 * or EqualityComparer to compare values.
 * @param first An IEnumerable<T> whose elements that are not also in second will be returned.
 * @param second An IEnumerable<T> whose elements that also occur in the first sequence
 * will cause those elements to be removed from the returned sequence.
 * @param comparer An IEqualityComparer<T> to compare values. Optional.
 * @returns A sequence that contains the set difference of the elements of two sequences.
 */
exports.except = (first, second, comparer = shared_1.StrictEqualityComparer) => {
    function* iterator() {
        const secondArray = [...second];
        for (const firstItem of first) {
            let exists = false;
            for (let j = 0; j < secondArray.length; j++) {
                const secondItem = secondArray[j];
                if (comparer(firstItem, secondItem) === true) {
                    exists = true;
                    break;
                }
            }
            if (exists === false) {
                yield firstItem;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 202:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.exceptAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Produces the set difference of two sequences by using the comparer provided to compare values.
 * @param first An IEnumerable<T> whose elements that are not also in second will be returned.
 * @param second An IEnumerable<T> whose elements that also occur in the first sequence
 * will cause those elements to be removed from the returned sequence.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns A sequence that contains the set difference of the elements of two sequences.
 */
exports.exceptAsync = (first, second, comparer) => {
    async function* iterator() {
        const secondArray = [...second];
        for (const firstItem of first) {
            let exists = false;
            for (let j = 0; j < secondArray.length; j++) {
                const secondItem = secondArray[j];
                if (await comparer(firstItem, secondItem) === true) {
                    exists = true;
                    break;
                }
            }
            if (exists === false) {
                yield firstItem;
            }
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 3633:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.first = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns first element in sequence that satisfies predicate otherwise
 * returns the first element in the sequence.
 * @param source An Iterable<T> to return an element from.
 * @param predicate A function to test each element for a condition. Optional.
 * @throws {InvalidOperationException} No elements in Iteration matching predicate
 * @returns The first element in the sequence
 * or the first element that passes the test in the specified predicate function.
 */
exports.first = (source, predicate) => {
    if (predicate) {
        return first2(source, predicate);
    }
    else {
        return first1(source);
    }
};
const first1 = (source) => {
    // eslint-disable-next-line no-shadow
    const first = source[Symbol.iterator]().next();
    if (first.done === true) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return first.value;
};
const first2 = (source, predicate) => {
    for (const value of source) {
        if (predicate(value) === true) {
            return value;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
};


/***/ }),

/***/ 6717:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the first element in a sequence that satisfies a specified condition.
 * @param source An Iterable<T> to return an element from.
 * @param predicate A function to test each element for a condition.
 * @throws {InvalidOperationException} No elements in Iteration matching predicate
 * @returns The first element in the sequence that passes the test in the specified predicate function.
 */
exports.firstAsync = async (source, predicate) => {
    for (const value of source) {
        if (await predicate(value) === true) {
            return value;
        }
    }
    throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
};


/***/ }),

/***/ 1250:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstOrDefault = void 0;
/**
 * Returns first element in sequence that satisfies predicate otherwise
 * returns the first element in the sequence. Returns null if no value found.
 * @param source An Iterable<T> to return an element from.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The first element in the sequence
 * or the first element that passes the test in the specified predicate function.
 * Returns null if no value found.
 */
exports.firstOrDefault = (source, predicate) => {
    if (predicate) {
        return firstOrDefault2(source, predicate);
    }
    else {
        return firstOrDefault1(source);
    }
};
const firstOrDefault1 = (source) => {
    const first = source[Symbol.iterator]().next();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return first.value || null;
};
const firstOrDefault2 = (source, predicate) => {
    for (const value of source) {
        if (predicate(value) === true) {
            return value;
        }
    }
    return null;
};


/***/ }),

/***/ 5559:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.firstOrDefaultAsync = void 0;
/**
 * Returns the first element of the sequence that satisfies a condition or a default value if no such element is found.
 * @param source An Iterable<T> to return an element from.
 * @param predicate An async function to test each element for a condition.
 * @returns null if source is empty or if no element passes the test specified by predicate;
 * otherwise, the first element in source that passes the test specified by predicate.
 */
async function firstOrDefaultAsync(source, predicate) {
    for (const value of source) {
        if (await predicate(value) === true) {
            return value;
        }
    }
    return null;
}
exports.firstOrDefaultAsync = firstOrDefaultAsync;


/***/ }),

/***/ 7267:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupBy = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
const groupByShared_1 = __nccwpck_require__(8382);
function groupBy(source, keySelector, comparer) {
    let iterable;
    if (comparer) {
        iterable = groupByShared_1.groupBy_0(source, keySelector, comparer);
    }
    else {
        iterable = groupByShared_1.groupBy_0_Simple(source, keySelector);
    }
    return new BasicEnumerable_1.BasicEnumerable(iterable);
}
exports.groupBy = groupBy;


/***/ }),

/***/ 2697:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupByAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
const Grouping_1 = __nccwpck_require__(891);
function groupByAsync(source, keySelector, comparer) {
    if (comparer) {
        return groupByAsync_0(source, keySelector, comparer);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return groupByAsync_0_Simple(source, keySelector);
    }
}
exports.groupByAsync = groupByAsync;
function groupByAsync_0_Simple(source, keySelector) {
    async function* iterator() {
        const keyMap = {};
        for (const value of source) {
            const key = await keySelector(value);
            const grouping = keyMap[key];
            if (grouping) {
                grouping.push(value);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, value);
            }
        }
        // eslint-disable-next-line guard-for-in
        for (const value in keyMap) {
            yield keyMap[value];
        }
    }
    return fromAsync_1.fromAsync(iterator);
}
function groupByAsync_0(source, keySelector, comparer) {
    async function* generate() {
        const keyMap = new Array();
        for (const value of source) {
            const key = await keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (await comparer(group.key, key) === true) {
                    group.push(value);
                    found = true;
                    break;
                }
            }
            if (found === false) {
                keyMap.push(new Grouping_1.Grouping(key, value));
            }
        }
        for (const keyValue of keyMap) {
            yield keyValue;
        }
    }
    return fromAsync_1.fromAsync(generate);
}


/***/ }),

/***/ 8382:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupBy_1 = exports.groupBy_1_Simple = exports.groupBy_0_Simple = exports.groupBy_0 = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
const Grouping_1 = __nccwpck_require__(891);
/* eslint-disable jsdoc/require-returns */
/* eslint-disable @typescript-eslint/naming-convention,no-underscore-dangle,id-blacklist,id-match */
/**
 * Group and Iterable Based on a Generic Key and an equality comparer
 * @param source Iteration
 * @param keySelector Key Selector
 * @param comparer Key Comparer
 * @private
 */
exports.groupBy_0 = (source, keySelector, comparer) => {
    return function* generate() {
        const keyMap = new Array();
        for (const value of source) {
            const key = keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (comparer(group.key, key)) {
                    group.push(value);
                    found = true;
                    break;
                }
            }
            if (found === false) {
                keyMap.push(new Grouping_1.Grouping(key, value));
            }
        }
        for (const keyValue of keyMap) {
            yield keyValue;
        }
    };
};
/**
 * @private
 */
exports.groupBy_0_Simple = (source, keySelector) => {
    return function* iterator() {
        const keyMap = {};
        for (const value of source) {
            const key = keySelector(value);
            const grouping = keyMap[key];
            if (grouping) {
                grouping.push(value);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, value);
            }
        }
        // eslint-disable-next-line guard-for-in
        for (const value in keyMap) {
            yield keyMap[value];
        }
    };
};
/**
 * @private
 */
function groupBy_1_Simple(source, keySelector, elementSelector) {
    function* generate() {
        const keyMap = {};
        for (const value of source) {
            const key = keySelector(value);
            const grouping = keyMap[key];
            const element = elementSelector(value);
            if (grouping) {
                grouping.push(element);
            }
            else {
                keyMap[key] = new Grouping_1.Grouping(key, element);
            }
        }
        /* eslint-disable guard-for-in */
        for (const value in keyMap) {
            yield keyMap[value];
        }
        /* eslint-enable guard-for-in */
    }
    return new BasicEnumerable_1.BasicEnumerable(generate);
}
exports.groupBy_1_Simple = groupBy_1_Simple;
/**
 * @private
 */
function groupBy_1(source, keySelector, elementSelector, comparer) {
    function* generate() {
        const keyMap = new Array();
        for (const value of source) {
            const key = keySelector(value);
            let found = false;
            for (let i = 0; i < keyMap.length; i++) {
                const group = keyMap[i];
                if (comparer(group.key, key)) {
                    group.push(elementSelector(value));
                    found = true;
                    break;
                }
            }
            if (found === false) {
                const element = elementSelector(value);
                keyMap.push(new Grouping_1.Grouping(key, element));
            }
        }
        for (const keyValue of keyMap) {
            yield keyValue;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(generate);
}
exports.groupBy_1 = groupBy_1;


/***/ }),

/***/ 1647:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.groupByWithSel = void 0;
const groupByShared_1 = __nccwpck_require__(8382);
function groupByWithSel(source, keySelector, elementSelector, comparer) {
    if (comparer) {
        return groupByShared_1.groupBy_1(source, keySelector, elementSelector, comparer);
    }
    else {
        return groupByShared_1.groupBy_1_Simple(source, keySelector, elementSelector);
    }
}
exports.groupByWithSel = groupByWithSel;


/***/ }),

/***/ 1400:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.intersect = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Produces the set intersection of two sequences by using the specified IEqualityComparer<T> to compare values.
 * If no comparer is selected, uses the StrictEqualityComparer.
 * @param first An IEnumerable<T> whose distinct elements that also appear in second will be returned.
 * @param second An Iterable<T> whose distinct elements that also appear in the first sequence will be returned.
 * @param comparer An IEqualityComparer<T> to compare values. Optional.
 * @returns A sequence that contains the elements that form the set intersection of two sequences.
 */
exports.intersect = (first, second, comparer = shared_1.StrictEqualityComparer) => {
    function* iterator() {
        const firstResults = [...first.distinct(comparer)];
        if (firstResults.length === 0) {
            return;
        }
        const secondResults = [...second];
        for (let i = 0; i < firstResults.length; i++) {
            const firstValue = firstResults[i];
            for (let j = 0; j < secondResults.length; j++) {
                const secondValue = secondResults[j];
                if (comparer(firstValue, secondValue) === true) {
                    yield firstValue;
                    break;
                }
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 6380:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.intersectAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Produces the set intersection of two sequences by using the specified IAsyncEqualityComparer<T> to compare values.
 * @param first An IEnumerable<T> whose distinct elements that also appear in second will be returned.
 * @param second An Iterable<T> whose distinct elements that also appear in the first sequence will be returned.
 * @param comparer An IAsyncEqualityComparer<T> to compare values.
 * @returns A sequence that contains the elements that form the set intersection of two sequences.
 */
exports.intersectAsync = (first, second, comparer) => {
    async function* iterator() {
        const firstResults = [];
        for await (const item of first.distinctAsync(comparer)) {
            firstResults.push(item);
        }
        if (firstResults.length === 0) {
            return;
        }
        const secondResults = [...second];
        for (let i = 0; i < firstResults.length; i++) {
            const firstValue = firstResults[i];
            for (let j = 0; j < secondResults.length; j++) {
                const secondValue = secondResults[j];
                if (await comparer(firstValue, secondValue) === true) {
                    yield firstValue;
                    break;
                }
            }
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 5095:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.join = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
// TODO: join Async
/**
 * Correlates the elements of two sequences based on matching keys.
 * A specified IEqualityComparer<T> is used to compare keys or the strict equality comparer.
 * @param outer The first sequence to join.
 * @param inner The sequence to join to the first sequence.
 * @param outerKeySelector A function to extract the join key from each element of the first sequence.
 * @param innerKeySelector A function to extract the join key from each element of the second sequence.
 * @param resultSelector A function to create a result element from two matching elements.
 * @param comparer An IEqualityComparer<T> to hash and compare keys. Optional.
 * @returns An IEnumerable<T> that has elements of type TResult that
 * are obtained by performing an inner join on two sequences.
 */
exports.join = (outer, inner, outerKeySelector, innerKeySelector, resultSelector, comparer = shared_1.StrictEqualityComparer) => {
    function* iterator() {
        const innerArray = [...inner];
        for (const o of outer) {
            const outerKey = outerKeySelector(o);
            for (const i of innerArray) {
                const innerKey = innerKeySelector(i);
                if (comparer(outerKey, innerKey) === true) {
                    yield resultSelector(o, i);
                }
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 7768:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.last = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the last element of a sequence.
 * If predicate is specified, the last element of a sequence that satisfies a specified condition.
 * @param source An Iterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The value at the last position in the source sequence
 * or the last element in the sequence that passes the test in the specified predicate function.
 */
exports.last = (source, predicate) => {
    if (predicate) {
        return last2(source, predicate);
    }
    else {
        return last1(source);
    }
};
const last1 = (source) => {
    let lastItem;
    for (const value of source) {
        lastItem = value;
    }
    if (!lastItem) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return lastItem;
};
const last2 = (source, predicate) => {
    let lastItem;
    for (const value of source) {
        if (predicate(value) === true) {
            lastItem = value;
        }
    }
    if (!lastItem) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return lastItem;
};


/***/ }),

/***/ 7040:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the last element of a sequence that satisfies a specified condition.
 * @param source An Iterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition.
 * @throws {InvalidOperationException} The source sequence is empty.
 * @returns The last element in the sequence that passes the test in the specified predicate function.
 */
exports.lastAsync = async (source, predicate) => {
    let last;
    for (const value of source) {
        if (await predicate(value) === true) {
            last = value;
        }
    }
    if (!last) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return last;
};


/***/ }),

/***/ 9490:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastOrDefault = void 0;
/**
 * Returns the last element of a sequence.
 * If predicate is specified, the last element of a sequence that satisfies a specified condition.
 * @param source An Iterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition. Optional.
 * @returns The value at the last position in the source sequence
 * or the last element in the sequence that passes the test in the specified predicate function.
 */
function lastOrDefault(source, predicate) {
    if (predicate) {
        return lastOrDefault2(source, predicate);
    }
    else {
        return lastOrDefault1(source);
    }
}
exports.lastOrDefault = lastOrDefault;
const lastOrDefault1 = (source) => {
    let last = null;
    for (const value of source) {
        last = value;
    }
    return last;
};
const lastOrDefault2 = (source, predicate) => {
    let last = null;
    for (const value of source) {
        if (predicate(value) === true) {
            last = value;
        }
    }
    return last;
};


/***/ }),

/***/ 4899:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lastOrDefaultAsync = void 0;
/**
 * Returns the last element of a sequence that satisfies a specified condition.
 * @param source An Iterable<T> to return the last element of.
 * @param predicate A function to test each element for a condition.
 * @returns The last element in the sequence that passes the test in the specified predicate function.
 * Null if no elements.
 */
exports.lastOrDefaultAsync = async (source, predicate) => {
    let last = null;
    for (const value of source) {
        if (await predicate(value) === true) {
            last = value;
        }
    }
    return last;
};


/***/ }),

/***/ 6526:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.max = void 0;
const shared_1 = __nccwpck_require__(5897);
function max(source, selector) {
    if (selector) {
        return max2(source, selector);
    }
    else {
        return max1(source);
    }
}
exports.max = max;
const max1 = (source) => {
    let maxItem = null;
    for (const item of source) {
        maxItem = Math.max(maxItem || Number.NEGATIVE_INFINITY, item);
    }
    if (maxItem === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return maxItem;
    }
};
const max2 = (source, selector) => {
    let maxItem = null;
    for (const item of source) {
        maxItem = Math.max(maxItem || Number.NEGATIVE_INFINITY, selector(item));
    }
    if (maxItem === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return maxItem;
    }
};


/***/ }),

/***/ 485:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.maxAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Invokes an async transform function on each element of a sequence and returns the maximum value.
 * @param source A sequence of values to determine the maximum value of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The maximum value in the sequence.
 */
exports.maxAsync = async (source, selector) => {
    let max = null;
    for (const item of source) {
        max = Math.max(max || Number.NEGATIVE_INFINITY, await selector(item));
    }
    if (max === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return max;
    }
};


/***/ }),

/***/ 31:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.min = void 0;
const shared_1 = __nccwpck_require__(5897);
function min(source, selector) {
    if (selector) {
        return min2(source, selector);
    }
    else {
        return min1(source);
    }
}
exports.min = min;
const min1 = (source) => {
    let minItem = null;
    for (const item of source) {
        minItem = Math.min(minItem || Number.POSITIVE_INFINITY, item);
    }
    if (minItem === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return minItem;
    }
};
const min2 = (source, selector) => {
    let minItem = null;
    for (const item of source) {
        minItem = Math.min(minItem || Number.POSITIVE_INFINITY, selector(item));
    }
    if (minItem === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return minItem;
    }
};


/***/ }),

/***/ 5475:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.minAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Invokes a transform function on each element of a sequence and returns the minimum value.
 * @param source A sequence of values to determine the minimum value of.
 * @param selector A transform function to apply to each element.
 * @throws {InvalidOperationException} source contains no elements.
 * @returns The minimum value in the sequence.
 */
exports.minAsync = async (source, selector) => {
    let min = null;
    for (const item of source) {
        min = Math.min(min || Number.POSITIVE_INFINITY, await selector(item));
    }
    if (min === null) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    else {
        return min;
    }
};


/***/ }),

/***/ 1334:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ofType = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Applies a type filter to a source iteration
 * @param source Iteration to Filtery by Type
 * @param type Either value for typeof or a consturctor function
 * @returns Values that match the type string or are instance of type
 */
exports.ofType = (source, type) => {
    const typeCheck = typeof type === "string" ?
        ((x) => typeof x === type) :
        ((x) => x instanceof type);
    function* iterator() {
        for (const item of source) {
            if (typeCheck(item)) {
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 123:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderBy = void 0;
const OrderedEnumerable_1 = __nccwpck_require__(8249);
/**
 * Sorts the elements of a sequence in ascending order by using a specified or default comparer.
 * @param source A sequence of values to order.
 * @param keySelector A function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys. Optional.
 * @returns An IOrderedEnumerable<TElement> whose elements are sorted according to a key.
 */
function orderBy(source, keySelector, comparer) {
    return OrderedEnumerable_1.OrderedEnumerable.generate(source, keySelector, true, comparer);
}
exports.orderBy = orderBy;


/***/ }),

/***/ 5293:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByAsync = void 0;
const OrderedEnumerable_1 = __nccwpck_require__(8249);
/**
 * Sorts the elements of a sequence in ascending order by using a specified comparer.
 * @param source A sequence of values to order.
 * @param keySelector An async function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys.
 * @returns An IOrderedAsyncEnumerable<TElement> whose elements are sorted according to a key.
 */
function orderByAsync(source, keySelector, comparer) {
    return OrderedEnumerable_1.OrderedEnumerable.generateAsync(source, keySelector, true, comparer);
}
exports.orderByAsync = orderByAsync;


/***/ }),

/***/ 1098:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByDescending = void 0;
const OrderedEnumerable_1 = __nccwpck_require__(8249);
/**
 * Sorts the elements of a sequence in descending order by using a specified or default comparer.
 * @param source A sequence of values to order.
 * @param keySelector A function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys. Optional.
 * @returns An IOrderedEnumerable<TElement> whose elements are sorted in descending order according to a key.
 */
function orderByDescending(source, keySelector, comparer) {
    return OrderedEnumerable_1.OrderedEnumerable.generate(source, keySelector, false, comparer);
}
exports.orderByDescending = orderByDescending;


/***/ }),

/***/ 9594:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderByDescendingAsync = void 0;
const OrderedEnumerable_1 = __nccwpck_require__(8249);
/**
 * Sorts the elements of a sequence in descending order by using a specified comparer.
 * @param source A sequence of values to order.
 * @param keySelector An async function to extract a key from an element.
 * @param comparer An IComparer<T> to compare keys.
 * @returns An IOrderedAsyncEnumerable<TElement> whose elements are sorted in descending order according to a key.
 */
function orderByDescendingAsync(source, keySelector, comparer) {
    return OrderedEnumerable_1.OrderedEnumerable.generateAsync(source, keySelector, false, comparer);
}
exports.orderByDescendingAsync = orderByDescendingAsync;


/***/ }),

/***/ 5631:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reverse = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Inverts the order of the elements in a sequence.
 * @param source A sequence of values to reverse.
 * @returns A sequence whose elements correspond to those of the input sequence in reverse order.
 */
exports.reverse = (source) => {
    function* iterator() {
        for (const x of [...source].reverse()) {
            yield x;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 2998:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.select = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Projects each element of a sequence into a new form.
 * @param source A sequence of values to invoke a transform function on.
 * @param selector A key of TSource.
 * @returns
 * An IEnumerable<T> whose elements are the result of getting the value from the key on each element of source.
 */
function select(source, selector) {
    if (typeof selector === "function") {
        const { length } = selector;
        if (length === 1) {
            return select1(source, selector);
        }
        else {
            return select2(source, selector);
        }
    }
    else {
        return select3(source, selector);
    }
}
exports.select = select;
const select1 = (source, selector) => {
    function* iterator() {
        for (const value of source) {
            yield selector(value);
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const select2 = (source, selector) => {
    function* iterator() {
        let index = 0;
        for (const value of source) {
            yield selector(value, index);
            index++;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const select3 = (source, key) => {
    function* iterator() {
        for (const value of source) {
            yield value[key];
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 9362:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
function selectAsync(source, selector) {
    if (typeof selector === "function") {
        if (selector.length === 1) {
            return selectAsync1(source, selector);
        }
        else {
            return selectAsync2(source, selector);
        }
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return selectAsync3(source, selector);
    }
}
exports.selectAsync = selectAsync;
const selectAsync1 = (source, selector) => {
    async function* iterator() {
        for (const value of source) {
            yield selector(value);
        }
    }
    return fromAsync_1.fromAsync(iterator);
};
const selectAsync2 = (source, selector) => {
    async function* iterator() {
        let index = 0;
        for (const value of source) {
            yield selector(value, index);
            index++;
        }
    }
    return fromAsync_1.fromAsync(iterator);
};
const selectAsync3 = (source, key) => {
    async function* iterator() {
        for (const value of source) {
            yield value[key];
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 9430:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectMany = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
function selectMany(source, selector) {
    if (typeof selector === "function") {
        if (selector.length === 1) {
            return selectMany1(source, selector);
        }
        else {
            return selectMany2(source, selector);
        }
    }
    else {
        return selectMany3(source, selector);
    }
}
exports.selectMany = selectMany;
const selectMany1 = (source, selector) => {
    function* iterator() {
        for (const value of source) {
            for (const selectorValue of selector(value)) {
                yield selectorValue;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const selectMany2 = (source, selector) => {
    function* iterator() {
        let index = 0;
        for (const value of source) {
            for (const selectorValue of selector(value, index)) {
                yield selectorValue;
            }
            index++;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const selectMany3 = (source, selector) => {
    function* iterator() {
        for (const value of source) {
            for (const selectorValue of value[selector]) {
                yield selectorValue;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 3796:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectManyAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Projects each element of a sequence to an IAsyncEnumerable<T> and flattens the resulting sequences into one sequence.
 * @param source A sequence of values to project.
 * @param selector A transform function to apply to each element.
 * @returns An IAsyncEnumerable<T> whose elements are the result of invoking the
 * one-to-many transform function on each element of the input sequence.
 */
function selectManyAsync(source, selector) {
    if (selector.length === 1) {
        return selectManyAsync1(source, selector);
    }
    else {
        return selectManyAsync2(source, selector);
    }
}
exports.selectManyAsync = selectManyAsync;
const selectManyAsync1 = (source, selector) => {
    async function* generator() {
        for (const value of source) {
            const innerValues = await selector(value);
            for (const innerValue of innerValues) {
                yield innerValue;
            }
        }
    }
    return fromAsync_1.fromAsync(generator);
};
const selectManyAsync2 = (source, selector) => {
    async function* generator() {
        let index = 0;
        for (const value of source) {
            const innerValues = await selector(value, index);
            for (const innerValue of innerValues) {
                yield innerValue;
            }
            index++;
        }
    }
    return fromAsync_1.fromAsync(generator);
};


/***/ }),

/***/ 1748:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sequenceEquals = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Determines whether or not two sequences are equal
 * @param first first iterable
 * @param second second iterable
 * @param comparer Compare function to use, by default is @see {StrictEqualityComparer}
 * @returns Whether or not the two iterables are equal
 */
function sequenceEquals(first, second, comparer = shared_1.StrictEqualityComparer) {
    const firstIterator = first[Symbol.iterator]();
    const secondIterator = second[Symbol.iterator]();
    let firstResult = firstIterator.next();
    let secondResult = secondIterator.next();
    while (!firstResult.done && !secondResult.done) {
        if (!comparer(firstResult.value, secondResult.value)) {
            return false;
        }
        firstResult = firstIterator.next();
        secondResult = secondIterator.next();
    }
    return firstResult.done === true && secondResult.done === true;
}
exports.sequenceEquals = sequenceEquals;


/***/ }),

/***/ 6249:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sequenceEqualsAsync = void 0;
/**
 * Compares two sequences to see if they are equal using a async comparer function.
 * @param first First Sequence
 * @param second Second Sequence
 * @param comparer Async Comparer
 * @returns Whether or not the two iterations are equal
 */
async function sequenceEqualsAsync(first, second, comparer) {
    const firstIterator = first[Symbol.iterator]();
    const secondIterator = second[Symbol.iterator]();
    let firstResult = firstIterator.next();
    let secondResult = secondIterator.next();
    while (!firstResult.done && !secondResult.done) {
        if (await comparer(firstResult.value, secondResult.value) === false) {
            return false;
        }
        firstResult = firstIterator.next();
        secondResult = secondIterator.next();
    }
    return firstResult.done === true && secondResult.done === true;
}
exports.sequenceEqualsAsync = sequenceEqualsAsync;


/***/ }),

/***/ 4579:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.single = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the only element of a sequence that satisfies a specified condition (if specified),
 * and throws an exception if more than one such element exists.
 * @param source An Iterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. (Optional)
 * @throws {InvalidOperationException} No element satisfies the condition in predicate. OR
 * More than one element satisfies the condition in predicate. OR
 * The source sequence is empty.
 * @returns The single element of the input sequence that satisfies a condition.
 */
exports.single = (source, predicate) => {
    if (predicate) {
        return single2(source, predicate);
    }
    else {
        return single1(source);
    }
};
const single1 = (source) => {
    let hasValue = false;
    let singleValue = null;
    for (const value of source) {
        if (hasValue === true) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
        }
        else {
            hasValue = true;
            singleValue = value;
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoElements);
    }
    return singleValue;
};
const single2 = (source, predicate) => {
    let hasValue = false;
    let singleValue = null;
    for (const value of source) {
        if (predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return singleValue;
};


/***/ }),

/***/ 1488:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the only element of a sequence that satisfies a specified condition,
 * and throws an exception if more than one such element exists.
 * @param source An Iterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition.
 * @throws {InvalidOperationException}
 * No element satisfies the condition in predicate. OR
 * More than one element satisfies the condition in predicate. OR
 * The source sequence is empty.
 * @returns The single element of the input sequence that satisfies a condition.
 */
exports.singleAsync = async (source, predicate) => {
    let hasValue = false;
    let singleValue = null;
    for (const value of source) {
        if (await predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    if (hasValue === false) {
        throw new shared_1.InvalidOperationException(shared_1.ErrorString.NoMatch);
    }
    return singleValue;
};


/***/ }),

/***/ 4811:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleOrDefault = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * If predicate is specified returns the only element of a sequence that satisfies a specified condition,
 * ootherwise returns the only element of a sequence. Returns a default value if no such element exists.
 * @param source An Iterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. Optional.
 * @throws {InvalidOperationException}
 * If predicate is specified more than one element satisfies the condition in predicate,
 * otherwise the input sequence contains more than one element.
 * @returns The single element of the input sequence that satisfies the condition,
 * or null if no such element is found.
 */
exports.singleOrDefault = (source, predicate) => {
    if (predicate) {
        return singleOrDefault2(source, predicate);
    }
    else {
        return singleOrDefault1(source);
    }
};
const singleOrDefault1 = (source) => {
    let hasValue = false;
    let singleValue = null;
    for (const value of source) {
        if (hasValue === true) {
            throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
        }
        else {
            hasValue = true;
            singleValue = value;
        }
    }
    return singleValue;
};
const singleOrDefault2 = (source, predicate) => {
    let hasValue = false;
    let singleValue = null;
    for (const value of source) {
        if (predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneMatchingElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    return singleValue;
};


/***/ }),

/***/ 6250:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.singleOrDefaultAsync = void 0;
const shared_1 = __nccwpck_require__(5897);
/**
 * Returns the only element of a sequence that satisfies a specified condition.
 * Returns a default value if no such element exists.
 * @param source An Iterable<T> to return a single element from.
 * @param predicate A function to test an element for a condition. Optional.
 * @throws {InvalidOperationException}
 * If predicate is specified more than one element satisfies the condition in predicate,
 * otherwise the input sequence contains more than one element.
 * @returns The single element of the input sequence that satisfies the condition,
 * or null if no such element is found.
 */
exports.singleOrDefaultAsync = async (source, predicate) => {
    let hasValue = false;
    let singleValue = null;
    for (const value of source) {
        if (await predicate(value)) {
            if (hasValue === true) {
                throw new shared_1.InvalidOperationException(shared_1.ErrorString.MoreThanOneElement);
            }
            else {
                hasValue = true;
                singleValue = value;
            }
        }
    }
    return singleValue;
};


/***/ }),

/***/ 1504:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skip = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Bypasses a specified number of elements in a sequence and then returns the remaining elements.
 * @param source An Iterable<T> to return elements from.
 * @param count The number of elements to skip before returning the remaining elements.
 * @returns An IEnumerable<T> that contains the elements that occur after the specified index in the input sequence.
 */
exports.skip = (source, count) => {
    function* iterator() {
        let i = 0;
        for (const item of source) {
            if (i++ >= count) {
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 9517:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skipWhile = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
 * The element's index is used in the logic of the predicate function.
 * @param source An Iterable<T> to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IEnumerable<T> that contains the elements from the input sequence starting at the first element
 * in the linear series that does not pass the test specified by predicate.
 */
exports.skipWhile = (source, predicate) => {
    if (predicate.length === 1) {
        return skipWhile1(source, predicate);
    }
    else {
        return skipWhile2(source, predicate);
    }
};
const skipWhile1 = (source, predicate) => {
    function* iterator() {
        let skip = true;
        for (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (predicate(item) === false) {
                skip = false;
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const skipWhile2 = (source, predicate) => {
    function* iterator() {
        let index = 0;
        let skip = true;
        for (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (predicate(item, index) === false) {
                skip = false;
                yield item;
            }
            index++;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 7112:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.skipWhileAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Bypasses elements in a sequence as long as a specified condition is true and then returns the remaining elements.
 * The element's index is used in the logic of the predicate function.
 * @param source An Iterable<T> to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains the elements from the input sequence starting
 * at the first element in the linear series that does not pass the test specified by predicate.
 */
exports.skipWhileAsync = (source, predicate) => {
    if (predicate.length === 1) {
        return skipWhileAsync1(source, predicate);
    }
    else {
        return skipWhileAsync2(source, predicate);
    }
};
const skipWhileAsync1 = (source, predicate) => {
    async function* iterator() {
        let skip = true;
        for (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (await predicate(item) === false) {
                skip = false;
                yield item;
            }
        }
    }
    return fromAsync_1.fromAsync(iterator);
};
const skipWhileAsync2 = (source, predicate) => {
    async function* iterator() {
        let index = 0;
        let skip = true;
        for (const item of source) {
            if (skip === false) {
                yield item;
            }
            else if (await predicate(item, index) === false) {
                skip = false;
                yield item;
            }
            index++;
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 4747:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sum = void 0;
function sum(source, selector) {
    if (selector) {
        return sum2(source, selector);
    }
    else {
        return sum1(source);
    }
}
exports.sum = sum;
const sum1 = (source) => {
    let total = 0;
    for (const value of source) {
        total += value;
    }
    return total;
};
const sum2 = (source, selector) => {
    let total = 0;
    for (const value of source) {
        total += selector(value);
    }
    return total;
};


/***/ }),

/***/ 5914:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sumAsync = void 0;
/**
 * Computes the sum of the sequence of numeric values that are obtained by invoking a transform function
 * on each element of the input sequence.
 * @param source A sequence of values that are used to calculate a sum.
 * @param selector A transform function to apply to each element.
 * @returns The sum of the projected values.
 */
exports.sumAsync = async (source, selector) => {
    let sum = 0;
    for (const value of source) {
        sum += await selector(value);
    }
    return sum;
};


/***/ }),

/***/ 7429:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.take = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Returns a specified number of contiguous elements from the start of a sequence.
 * @param source The sequence to return elements from.
 * @param amount The number of elements to return.
 * @returns An IEnumerable<T> that contains the specified number of elements from the start of the input sequence.
 */
exports.take = (source, amount) => {
    function* iterator() {
        // negative amounts should yield empty
        let amountLeft = amount > 0 ? amount : 0;
        for (const item of source) {
            if (amountLeft-- === 0) {
                break;
            }
            else {
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 3875:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.takeWhile = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Returns elements from a sequence as long as a specified condition is true.
 * The element's index is used in the logic of the predicate function.
 * @param source The sequence to return elements from.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IEnumerable<T> that contains elements from the input sequence
 * that occur before the element at which the test no longer passes.
 */
exports.takeWhile = (source, predicate) => {
    if (predicate.length === 1) {
        return takeWhile1(source, predicate);
    }
    else {
        return takeWhile2(source, predicate);
    }
};
const takeWhile1 = (source, predicate) => {
    /**
     * @internal
     */
    function* iterator() {
        for (const item of source) {
            if (predicate(item)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const takeWhile2 = (source, predicate) => {
    function* iterator() {
        let index = 0;
        for (const item of source) {
            if (predicate(item, index++)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 4277:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.takeWhileAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Returns elements from a sequence as long as a specified condition is true.
 * The element's index is used in the logic of the predicate function.
 * @param source The sequence to return elements from.
 * @param predicate A async function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence
 * that occur before the element at which the test no longer passes.
 */
function takeWhileAsync(source, predicate) {
    if (predicate.length === 1) {
        return takeWhileAsync1(source, predicate);
    }
    else {
        return takeWhileAsync2(source, predicate);
    }
}
exports.takeWhileAsync = takeWhileAsync;
const takeWhileAsync1 = (source, predicate) => {
    async function* iterator() {
        for (const item of source) {
            if (await predicate(item)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return fromAsync_1.fromAsync(iterator);
};
const takeWhileAsync2 = (source, predicate) => {
    async function* iterator() {
        let index = 0;
        for (const item of source) {
            if (await predicate(item, index++)) {
                yield item;
            }
            else {
                break;
            }
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 7708:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toArray = void 0;
/**
 * Creates an array from a Iterable<T>.
 * @param source An Iterable<T> to create an array from.
 * @returns An array of elements
 */
exports.toArray = (source) => {
    return [...source];
};


/***/ }),

/***/ 5036:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toMap = void 0;
/**
 * Converts an Iterable<V> to a Map<K, V[]>.
 * @param source An Iterable<V> to convert.
 * @param selector A function to serve as a key selector.
 * @returns Map<K, V[]>
 */
exports.toMap = (source, selector) => {
    const map = new Map();
    for (const value of source) {
        const key = selector(value);
        const array = map.get(key);
        if (array === undefined) {
            map.set(key, [value]);
        }
        else {
            array.push(value);
        }
    }
    return map;
};


/***/ }),

/***/ 2124:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toMapAsync = void 0;
/**
 * Converts an Iterable<V> to a Map<K, V[]>.
 * @param source An Iterable<V> to convert.
 * @param selector An async function to serve as a key selector.
 * @returns A promise for Map<K, V[]>
 */
async function toMapAsync(source, selector) {
    const map = new Map();
    for (const value of source) {
        const key = await selector(value);
        const array = map.get(key);
        if (array === undefined) {
            map.set(key, [value]);
        }
        else {
            array.push(value);
        }
    }
    return map;
}
exports.toMapAsync = toMapAsync;


/***/ }),

/***/ 4469:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toSet = void 0;
/**
 * Converts the Itertion to a Set
 * @param source Iteration
 * @returns Set containing the iteration values
 */
exports.toSet = (source) => {
    return new Set(source);
};


/***/ }),

/***/ 3396:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.union = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Produces the set union of two sequences by using scrict equality comparison or a specified IEqualityComparer<T>.
 * @param first An Iterable<T> whose distinct elements form the first set for the union.
 * @param second An Iterable<T> whose distinct elements form the second set for the union.
 * @param comparer The IEqualityComparer<T> to compare values. Optional.
 * @returns An IEnumerable<T> that contains the elements from both input sequences, excluding duplicates.
 */
exports.union = (first, second, comparer) => {
    if (comparer) {
        return union2(first, second, comparer);
    }
    else {
        return union1(first, second);
    }
};
const union1 = (first, second) => {
    function* iterator() {
        const set = new Set();
        for (const item of first) {
            if (set.has(item) === false) {
                yield item;
                set.add(item);
            }
        }
        for (const item of second) {
            if (set.has(item) === false) {
                yield item;
                set.add(item);
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const union2 = (first, second, comparer) => {
    function* iterator() {
        const result = [];
        for (const source of [first, second]) {
            for (const value of source) {
                let exists = false;
                for (const resultValue of result) {
                    if (comparer(value, resultValue) === true) {
                        exists = true;
                        break;
                    }
                }
                if (exists === false) {
                    yield value;
                    result.push(value);
                }
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 5489:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unionAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Produces the set union of two sequences by using a specified IAsyncEqualityComparer<T>.
 * @param first An Iterable<T> whose distinct elements form the first set for the union.
 * @param second An Iterable<T> whose distinct elements form the second set for the union.
 * @param comparer The IAsyncEqualityComparer<T> to compare values.
 * @returns An IAsyncEnumerable<T> that contains the elements from both input sequences, excluding duplicates.
 */
exports.unionAsync = (first, second, comparer) => {
    async function* iterator() {
        const result = [];
        for (const source of [first, second]) {
            for (const value of source) {
                let exists = false;
                for (const resultValue of result) {
                    if (await comparer(value, resultValue) === true) {
                        exists = true;
                        break;
                    }
                }
                if (exists === false) {
                    yield value;
                    result.push(value);
                }
            }
        }
    }
    return fromAsync_1.fromAsync(iterator);
};


/***/ }),

/***/ 2745:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.where = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Filters a sequence of values based on a predicate.
 * Each element's index is used in the logic of the predicate function.
 * @param source An Iterable<T> to filter.
 * @param predicate A function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IEnumerable<T> that contains elements from the input sequence that satisfy the condition.
 */
exports.where = (source, predicate) => {
    if (predicate.length === 1) {
        return where1(source, predicate);
    }
    else {
        return where2(source, predicate);
    }
};
const where1 = (source, predicate) => {
    function* iterator() {
        for (const item of source) {
            if (predicate(item) === true) {
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const where2 = (source, predicate) => {
    function* iterator() {
        let i = 0;
        for (const item of source) {
            if (predicate(item, i++) === true) {
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 2971:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.whereAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Filters a sequence of values based on a predicate.
 * Each element's index is used in the logic of the predicate function.
 * @param source An Iterable<T> to filter.
 * @param predicate A async function to test each source element for a condition;
 * the second parameter of the function represents the index of the source element.
 * @returns An IAsyncEnumerable<T> that contains elements from the input sequence that satisfy the condition.
 */
exports.whereAsync = (source, predicate) => {
    if (predicate.length === 1) {
        return whereAsync1(source, predicate);
    }
    else {
        return whereAsync2(source, predicate);
    }
};
const whereAsync1 = (source, predicate) => {
    async function* generator() {
        for (const item of source) {
            if (await predicate(item) === true) {
                yield item;
            }
        }
    }
    return fromAsync_1.fromAsync(generator);
};
const whereAsync2 = (source, predicate) => {
    async function* generator() {
        let i = 0;
        for (const item of source) {
            if (await predicate(item, i++) === true) {
                yield item;
            }
        }
    }
    return fromAsync_1.fromAsync(generator);
};


/***/ }),

/***/ 4172:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.zip = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
function zip(source, second, resultSelector) {
    if (resultSelector) {
        return zip2(source, second, resultSelector);
    }
    else {
        return zip1(source, second);
    }
}
exports.zip = zip;
const zip1 = (source, second) => {
    function* iterator() {
        const firstIterator = source[Symbol.iterator]();
        const secondIterator = second[Symbol.iterator]();
        while (true) {
            const a = firstIterator.next();
            const b = secondIterator.next();
            if (a.done && b.done) {
                break;
            }
            else {
                yield [a.value, b.value];
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};
const zip2 = (source, second, resultSelector) => {
    function* iterator() {
        const firstIterator = source[Symbol.iterator]();
        const secondIterator = second[Symbol.iterator]();
        while (true) {
            const a = firstIterator.next();
            const b = secondIterator.next();
            if (a.done && b.done) {
                break;
            }
            else {
                yield resultSelector(a.value, b.value);
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 3202:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.zipAsync = void 0;
const fromAsync_1 = __nccwpck_require__(5641);
/**
 * Applies a specified async function to the corresponding elements of two sequences,
 * producing a sequence of the results.
 * @param first The first sequence to merge.
 * @param second The second sequence to merge.
 * @param resultSelector An async function that specifies how to merge the elements from the two sequences.
 * @returns An IAsyncEnumerable<T> that contains merged elements of two input sequences.
 */
exports.zipAsync = (first, second, resultSelector) => {
    async function* generator() {
        const firstIterator = first[Symbol.iterator]();
        const secondIterator = second[Symbol.iterator]();
        while (true) {
            const a = firstIterator.next();
            const b = secondIterator.next();
            if (a.done && b.done) {
                break;
            }
            else {
                yield resultSelector(a.value, b.value);
            }
        }
    }
    return fromAsync_1.fromAsync(generator);
};


/***/ }),

/***/ 8120:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isEnumerable = void 0;
const ArrayEnumerable_1 = __nccwpck_require__(8640);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * Determine if a source is a IEnumerable
 * @param source Any Value
 * @returns Whether or not this is an Enumerable type
 */
exports.isEnumerable = (source) => {
    if (!source) {
        return false;
    }
    if (source instanceof BasicEnumerable_1.BasicEnumerable) {
        return true;
    }
    if (source instanceof ArrayEnumerable_1.ArrayEnumerable) {
        return true;
    }
    if (typeof source[Symbol.iterator] !== "function") {
        return false;
    }
    const propertyNames = Object.getOwnPropertyNames(BasicEnumerable_1.BasicEnumerable.prototype)
        .filter((v) => v !== "constructor");
    const methods = source.prototype || source;
    for (const prop of propertyNames) {
        if (typeof methods[prop] !== "function") {
            return false;
        }
    }
    return true;
};


/***/ }),

/***/ 4663:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.empty = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Returns an empty IEnumerable<T> that has the specified type argument.
 * @returns An empty IEnumerable<T> whose type argument is TResult.
 */
exports.empty = () => {
    const iterator = function* () {
        for (const x of []) {
            yield x;
        }
    };
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 6696:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.enumerateObject = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Iterates through the object
 * @param source Source Object
 * @returns IEnumerabe<[TKey, TValue]> of Key Value pairs
 */
exports.enumerateObject = (source) => {
    function* iterable() {
        // eslint-disable-next-line guard-for-in
        for (const key in source) {
            yield [key, source[key]];
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterable);
};


/***/ }),

/***/ 4656:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.flatten = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
function flatten(source, shallow) {
    // eslint-disable-next-line no-shadow
    function* iterator(source) {
        for (const item of source) {
            // JS string is an Iterable.
            // We exclude it from being flattened
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (item[Symbol.iterator] !== undefined && typeof item !== "string") {
                yield* shallow ? item : iterator(item);
            }
            else {
                yield item;
            }
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(() => iterator(source));
}
exports.flatten = flatten;


/***/ }),

/***/ 7268:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.from = void 0;
const BasicEnumerable_1 = __nccwpck_require__(3706);
function from(source) {
    const isArrayLike = (x) => {
        return Array.isArray(x) || (typeof x === "object" && typeof x.length === "number" && (x.length === 0 || 0 in x));
    };
    const isIterableType = (x) => typeof x === "function";
    if (isArrayLike(source)) {
        const generator = function* () {
            for (let i = 0; i < source.length; i++) {
                yield source[i];
            }
        };
        return new BasicEnumerable_1.BasicEnumerable(generator);
    }
    if (isIterableType(source)) {
        return new BasicEnumerable_1.BasicEnumerable(source);
    }
    return new BasicEnumerable_1.BasicEnumerable(function* () {
        for (const val of source) {
            yield val;
        }
    });
}
exports.from = from;


/***/ }),

/***/ 2374:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var empty_1 = __nccwpck_require__(4663);
Object.defineProperty(exports, "empty", ({ enumerable: true, get: function () { return empty_1.empty; } }));
var enumerateObject_1 = __nccwpck_require__(6696);
Object.defineProperty(exports, "enumerateObject", ({ enumerable: true, get: function () { return enumerateObject_1.enumerateObject; } }));
var flatten_1 = __nccwpck_require__(4656);
Object.defineProperty(exports, "flatten", ({ enumerable: true, get: function () { return flatten_1.flatten; } }));
var from_1 = __nccwpck_require__(7268);
Object.defineProperty(exports, "from", ({ enumerable: true, get: function () { return from_1.from; } }));
var partition_1 = __nccwpck_require__(3571);
Object.defineProperty(exports, "partition", ({ enumerable: true, get: function () { return partition_1.partition; } }));
var range_1 = __nccwpck_require__(1858);
Object.defineProperty(exports, "range", ({ enumerable: true, get: function () { return range_1.range; } }));
var repeat_1 = __nccwpck_require__(8886);
Object.defineProperty(exports, "repeat", ({ enumerable: true, get: function () { return repeat_1.repeat; } }));


/***/ }),

/***/ 3571:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.partition = void 0;
/**
 * Paritions the Iterable<T> into a tuple of failing and passing arrays
 * based on the predicate.
 * @param source Elements to Partition
 * @param predicate Pass / Fail condition
 * @returns [pass, fail]
 */
exports.partition = (source, predicate) => {
    const fail = [];
    const pass = [];
    for (const value of source) {
        if (predicate(value) === true) {
            pass.push(value);
        }
        else {
            fail.push(value);
        }
    }
    return [pass, fail];
};


/***/ }),

/***/ 1858:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.range = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Generates a sequence of integral numbers within a specified range.
 * @param start The value of the first integer in the sequence.
 * @param count The number of sequential integers to generate.
 * @throws {ArgumentOutOfRangeException} Start is Less than 0
 * OR start + count -1 is larger than MAX_SAFE_INTEGER.
 * @returns An IEnumerable<number> that contains a range of sequential integral numbers.
 */
exports.range = (start, count) => {
    if (start < 0 || (start + count - 1) > Number.MAX_SAFE_INTEGER) {
        throw new shared_1.ArgumentOutOfRangeException(`start`);
    }
    function* iterator() {
        const max = start + count;
        for (let i = start; i < max; i++) {
            yield i;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 8886:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.repeat = void 0;
const shared_1 = __nccwpck_require__(5897);
const BasicEnumerable_1 = __nccwpck_require__(3706);
/**
 * Generates a sequence that contains one repeated value.
 * @param element The value to be repeated.
 * @param count The number of times to repeat the value in the generated sequence.
 * @returns An IEnumerable<T> that contains a repeated value.
 */
exports.repeat = (element, count) => {
    if (count < 0) {
        throw new shared_1.ArgumentOutOfRangeException(`count`);
    }
    function* iterator() {
        for (let i = 0; i < count; i++) {
            yield element;
        }
    }
    return new BasicEnumerable_1.BasicEnumerable(iterator);
};


/***/ }),

/***/ 9581:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ 467:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Stream = _interopDefault(__nccwpck_require__(2413));
var http = _interopDefault(__nccwpck_require__(8605));
var Url = _interopDefault(__nccwpck_require__(8835));
var https = _interopDefault(__nccwpck_require__(7211));
var zlib = _interopDefault(__nccwpck_require__(8761));

// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js

// fix for "Readable" isn't a named export issue
const Readable = Stream.Readable;

const BUFFER = Symbol('buffer');
const TYPE = Symbol('type');

class Blob {
	constructor() {
		this[TYPE] = '';

		const blobParts = arguments[0];
		const options = arguments[1];

		const buffers = [];
		let size = 0;

		if (blobParts) {
			const a = blobParts;
			const length = Number(a.length);
			for (let i = 0; i < length; i++) {
				const element = a[i];
				let buffer;
				if (element instanceof Buffer) {
					buffer = element;
				} else if (ArrayBuffer.isView(element)) {
					buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
				} else if (element instanceof ArrayBuffer) {
					buffer = Buffer.from(element);
				} else if (element instanceof Blob) {
					buffer = element[BUFFER];
				} else {
					buffer = Buffer.from(typeof element === 'string' ? element : String(element));
				}
				size += buffer.length;
				buffers.push(buffer);
			}
		}

		this[BUFFER] = Buffer.concat(buffers);

		let type = options && options.type !== undefined && String(options.type).toLowerCase();
		if (type && !/[^\u0020-\u007E]/.test(type)) {
			this[TYPE] = type;
		}
	}
	get size() {
		return this[BUFFER].length;
	}
	get type() {
		return this[TYPE];
	}
	text() {
		return Promise.resolve(this[BUFFER].toString());
	}
	arrayBuffer() {
		const buf = this[BUFFER];
		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		return Promise.resolve(ab);
	}
	stream() {
		const readable = new Readable();
		readable._read = function () {};
		readable.push(this[BUFFER]);
		readable.push(null);
		return readable;
	}
	toString() {
		return '[object Blob]';
	}
	slice() {
		const size = this.size;

		const start = arguments[0];
		const end = arguments[1];
		let relativeStart, relativeEnd;
		if (start === undefined) {
			relativeStart = 0;
		} else if (start < 0) {
			relativeStart = Math.max(size + start, 0);
		} else {
			relativeStart = Math.min(start, size);
		}
		if (end === undefined) {
			relativeEnd = size;
		} else if (end < 0) {
			relativeEnd = Math.max(size + end, 0);
		} else {
			relativeEnd = Math.min(end, size);
		}
		const span = Math.max(relativeEnd - relativeStart, 0);

		const buffer = this[BUFFER];
		const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
		const blob = new Blob([], { type: arguments[2] });
		blob[BUFFER] = slicedBuffer;
		return blob;
	}
}

Object.defineProperties(Blob.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true }
});

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
	value: 'Blob',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * fetch-error.js
 *
 * FetchError interface for operational errors
 */

/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */
function FetchError(message, type, systemError) {
  Error.call(this, message);

  this.message = message;
  this.type = type;

  // when err.type is `system`, err.code contains system error code
  if (systemError) {
    this.code = this.errno = systemError.code;
  }

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';

let convert;
try {
	convert = __nccwpck_require__(2877).convert;
} catch (e) {}

const INTERNALS = Symbol('Body internals');

// fix an issue where "PassThrough" isn't a named export for node <10
const PassThrough = Stream.PassThrough;

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
function Body(body) {
	var _this = this;

	var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	    _ref$size = _ref.size;

	let size = _ref$size === undefined ? 0 : _ref$size;
	var _ref$timeout = _ref.timeout;
	let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

	if (body == null) {
		// body is undefined or null
		body = null;
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		body = Buffer.from(body.toString());
	} else if (isBlob(body)) ; else if (Buffer.isBuffer(body)) ; else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		body = Buffer.from(body);
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
	} else if (body instanceof Stream) ; else {
		// none of the above
		// coerce to string then buffer
		body = Buffer.from(String(body));
	}
	this[INTERNALS] = {
		body,
		disturbed: false,
		error: null
	};
	this.size = size;
	this.timeout = timeout;

	if (body instanceof Stream) {
		body.on('error', function (err) {
			const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
			_this[INTERNALS].error = error;
		});
	}
}

Body.prototype = {
	get body() {
		return this[INTERNALS].body;
	},

	get bodyUsed() {
		return this[INTERNALS].disturbed;
	},

	/**
  * Decode response as ArrayBuffer
  *
  * @return  Promise
  */
	arrayBuffer() {
		return consumeBody.call(this).then(function (buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		});
	},

	/**
  * Return raw response as Blob
  *
  * @return Promise
  */
	blob() {
		let ct = this.headers && this.headers.get('content-type') || '';
		return consumeBody.call(this).then(function (buf) {
			return Object.assign(
			// Prevent copying
			new Blob([], {
				type: ct.toLowerCase()
			}), {
				[BUFFER]: buf
			});
		});
	},

	/**
  * Decode response as json
  *
  * @return  Promise
  */
	json() {
		var _this2 = this;

		return consumeBody.call(this).then(function (buffer) {
			try {
				return JSON.parse(buffer.toString());
			} catch (err) {
				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
			}
		});
	},

	/**
  * Decode response as text
  *
  * @return  Promise
  */
	text() {
		return consumeBody.call(this).then(function (buffer) {
			return buffer.toString();
		});
	},

	/**
  * Decode response as buffer (non-spec api)
  *
  * @return  Promise
  */
	buffer() {
		return consumeBody.call(this);
	},

	/**
  * Decode response as text, while automatically detecting the encoding and
  * trying to decode to UTF-8 (non-spec api)
  *
  * @return  Promise
  */
	textConverted() {
		var _this3 = this;

		return consumeBody.call(this).then(function (buffer) {
			return convertBody(buffer, _this3.headers);
		});
	}
};

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true }
});

Body.mixIn = function (proto) {
	for (const name of Object.getOwnPropertyNames(Body.prototype)) {
		// istanbul ignore else: future proof
		if (!(name in proto)) {
			const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
			Object.defineProperty(proto, name, desc);
		}
	}
};

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */
function consumeBody() {
	var _this4 = this;

	if (this[INTERNALS].disturbed) {
		return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
	}

	this[INTERNALS].disturbed = true;

	if (this[INTERNALS].error) {
		return Body.Promise.reject(this[INTERNALS].error);
	}

	let body = this.body;

	// body is null
	if (body === null) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is blob
	if (isBlob(body)) {
		body = body.stream();
	}

	// body is buffer
	if (Buffer.isBuffer(body)) {
		return Body.Promise.resolve(body);
	}

	// istanbul ignore if: should never happen
	if (!(body instanceof Stream)) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is stream
	// get ready to actually consume the body
	let accum = [];
	let accumBytes = 0;
	let abort = false;

	return new Body.Promise(function (resolve, reject) {
		let resTimeout;

		// allow timeout on slow response body
		if (_this4.timeout) {
			resTimeout = setTimeout(function () {
				abort = true;
				reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
			}, _this4.timeout);
		}

		// handle stream errors
		body.on('error', function (err) {
			if (err.name === 'AbortError') {
				// if the request was aborted, reject with this Error
				abort = true;
				reject(err);
			} else {
				// other errors, such as incorrect content-encoding
				reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
			}
		});

		body.on('data', function (chunk) {
			if (abort || chunk === null) {
				return;
			}

			if (_this4.size && accumBytes + chunk.length > _this4.size) {
				abort = true;
				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
				return;
			}

			accumBytes += chunk.length;
			accum.push(chunk);
		});

		body.on('end', function () {
			if (abort) {
				return;
			}

			clearTimeout(resTimeout);

			try {
				resolve(Buffer.concat(accum, accumBytes));
			} catch (err) {
				// handle streams that have accumulated too much data (issue #414)
				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
			}
		});
	});
}

/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */
function convertBody(buffer, headers) {
	if (typeof convert !== 'function') {
		throw new Error('The package `encoding` must be installed to use the textConverted() function');
	}

	const ct = headers.get('content-type');
	let charset = 'utf-8';
	let res, str;

	// header
	if (ct) {
		res = /charset=([^;]*)/i.exec(ct);
	}

	// no charset in content type, peek at response body for at most 1024 bytes
	str = buffer.slice(0, 1024).toString();

	// html5
	if (!res && str) {
		res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
	}

	// html4
	if (!res && str) {
		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
		if (!res) {
			res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
			if (res) {
				res.pop(); // drop last quote
			}
		}

		if (res) {
			res = /charset=(.*)/i.exec(res.pop());
		}
	}

	// xml
	if (!res && str) {
		res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
	}

	// found charset
	if (res) {
		charset = res.pop();

		// prevent decode issues when sites use incorrect encoding
		// ref: https://hsivonen.fi/encoding-menu/
		if (charset === 'gb2312' || charset === 'gbk') {
			charset = 'gb18030';
		}
	}

	// turn raw buffers into a single utf-8 buffer
	return convert(buffer, 'UTF-8', charset).toString();
}

/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
	// Duck-typing as a necessary condition.
	if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
		return false;
	}

	// Brand-checking and more duck-typing as optional condition.
	return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
}

/**
 * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
 * @param  {*} obj
 * @return {boolean}
 */
function isBlob(obj) {
	return typeof obj === 'object' && typeof obj.arrayBuffer === 'function' && typeof obj.type === 'string' && typeof obj.stream === 'function' && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string' && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */
function clone(instance) {
	let p1, p2;
	let body = instance.body;

	// don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used');
	}

	// check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
		// tee instance body
		p1 = new PassThrough();
		p2 = new PassThrough();
		body.pipe(p1);
		body.pipe(p2);
		// set instance body to teed body and return the other teed body
		instance[INTERNALS].body = p1;
		body = p2;
	}

	return body;
}

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Any options.body input
 */
function extractContentType(body) {
	if (body === null) {
		// body is null
		return null;
	} else if (typeof body === 'string') {
		// body is string
		return 'text/plain;charset=UTF-8';
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		return 'application/x-www-form-urlencoded;charset=UTF-8';
	} else if (isBlob(body)) {
		// body is blob
		return body.type || null;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return null;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return null;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return null;
	} else if (typeof body.getBoundary === 'function') {
		// detect form data input from form-data module
		return `multipart/form-data;boundary=${body.getBoundary()}`;
	} else if (body instanceof Stream) {
		// body is stream
		// can't really do much about this
		return null;
	} else {
		// Body constructor defaults other things to string
		return 'text/plain;charset=UTF-8';
	}
}

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */
function getTotalBytes(instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		return 0;
	} else if (isBlob(body)) {
		return body.size;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return body.length;
	} else if (body && typeof body.getLengthSync === 'function') {
		// detect form data input from form-data module
		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
		body.hasKnownLength && body.hasKnownLength()) {
			// 2.x
			return body.getLengthSync();
		}
		return null;
	} else {
		// body is stream
		return null;
	}
}

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */
function writeToStream(dest, instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		dest.end();
	} else if (isBlob(body)) {
		body.stream().pipe(dest);
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		dest.write(body);
		dest.end();
	} else {
		// body is stream
		body.pipe(dest);
	}
}

// expose Promise
Body.Promise = global.Promise;

/**
 * headers.js
 *
 * Headers class offers convenient helpers
 */

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

function validateName(name) {
	name = `${name}`;
	if (invalidTokenRegex.test(name) || name === '') {
		throw new TypeError(`${name} is not a legal HTTP header name`);
	}
}

function validateValue(value) {
	value = `${value}`;
	if (invalidHeaderCharRegex.test(value)) {
		throw new TypeError(`${value} is not a legal HTTP header value`);
	}
}

/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */
function find(map, name) {
	name = name.toLowerCase();
	for (const key in map) {
		if (key.toLowerCase() === name) {
			return key;
		}
	}
	return undefined;
}

const MAP = Symbol('map');
class Headers {
	/**
  * Headers class
  *
  * @param   Object  headers  Response headers
  * @return  Void
  */
	constructor() {
		let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

		this[MAP] = Object.create(null);

		if (init instanceof Headers) {
			const rawHeaders = init.raw();
			const headerNames = Object.keys(rawHeaders);

			for (const headerName of headerNames) {
				for (const value of rawHeaders[headerName]) {
					this.append(headerName, value);
				}
			}

			return;
		}

		// We don't worry about converting prop to ByteString here as append()
		// will handle it.
		if (init == null) ; else if (typeof init === 'object') {
			const method = init[Symbol.iterator];
			if (method != null) {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable');
				}

				// sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				const pairs = [];
				for (const pair of init) {
					if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
						throw new TypeError('Each header pair must be iterable');
					}
					pairs.push(Array.from(pair));
				}

				for (const pair of pairs) {
					if (pair.length !== 2) {
						throw new TypeError('Each header pair must be a name/value tuple');
					}
					this.append(pair[0], pair[1]);
				}
			} else {
				// record<ByteString, ByteString>
				for (const key of Object.keys(init)) {
					const value = init[key];
					this.append(key, value);
				}
			}
		} else {
			throw new TypeError('Provided initializer must be an object');
		}
	}

	/**
  * Return combined header value given name
  *
  * @param   String  name  Header name
  * @return  Mixed
  */
	get(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key === undefined) {
			return null;
		}

		return this[MAP][key].join(', ');
	}

	/**
  * Iterate over all headers
  *
  * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
  * @param   Boolean   thisArg   `this` context for callback function
  * @return  Void
  */
	forEach(callback) {
		let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

		let pairs = getHeaders(this);
		let i = 0;
		while (i < pairs.length) {
			var _pairs$i = pairs[i];
			const name = _pairs$i[0],
			      value = _pairs$i[1];

			callback.call(thisArg, value, name, this);
			pairs = getHeaders(this);
			i++;
		}
	}

	/**
  * Overwrite header values given name
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	set(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		this[MAP][key !== undefined ? key : name] = [value];
	}

	/**
  * Append a value onto existing header
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	append(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			this[MAP][key].push(value);
		} else {
			this[MAP][name] = [value];
		}
	}

	/**
  * Check for header name existence
  *
  * @param   String   name  Header name
  * @return  Boolean
  */
	has(name) {
		name = `${name}`;
		validateName(name);
		return find(this[MAP], name) !== undefined;
	}

	/**
  * Delete all header values given name
  *
  * @param   String  name  Header name
  * @return  Void
  */
	delete(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			delete this[MAP][key];
		}
	}

	/**
  * Return raw headers (non-spec api)
  *
  * @return  Object
  */
	raw() {
		return this[MAP];
	}

	/**
  * Get an iterator on keys.
  *
  * @return  Iterator
  */
	keys() {
		return createHeadersIterator(this, 'key');
	}

	/**
  * Get an iterator on values.
  *
  * @return  Iterator
  */
	values() {
		return createHeadersIterator(this, 'value');
	}

	/**
  * Get an iterator on entries.
  *
  * This is the default iterator of the Headers object.
  *
  * @return  Iterator
  */
	[Symbol.iterator]() {
		return createHeadersIterator(this, 'key+value');
	}
}
Headers.prototype.entries = Headers.prototype[Symbol.iterator];

Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
	value: 'Headers',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Headers.prototype, {
	get: { enumerable: true },
	forEach: { enumerable: true },
	set: { enumerable: true },
	append: { enumerable: true },
	has: { enumerable: true },
	delete: { enumerable: true },
	keys: { enumerable: true },
	values: { enumerable: true },
	entries: { enumerable: true }
});

function getHeaders(headers) {
	let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';

	const keys = Object.keys(headers[MAP]).sort();
	return keys.map(kind === 'key' ? function (k) {
		return k.toLowerCase();
	} : kind === 'value' ? function (k) {
		return headers[MAP][k].join(', ');
	} : function (k) {
		return [k.toLowerCase(), headers[MAP][k].join(', ')];
	});
}

const INTERNAL = Symbol('internal');

function createHeadersIterator(target, kind) {
	const iterator = Object.create(HeadersIteratorPrototype);
	iterator[INTERNAL] = {
		target,
		kind,
		index: 0
	};
	return iterator;
}

const HeadersIteratorPrototype = Object.setPrototypeOf({
	next() {
		// istanbul ignore if
		if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
			throw new TypeError('Value of `this` is not a HeadersIterator');
		}

		var _INTERNAL = this[INTERNAL];
		const target = _INTERNAL.target,
		      kind = _INTERNAL.kind,
		      index = _INTERNAL.index;

		const values = getHeaders(target, kind);
		const len = values.length;
		if (index >= len) {
			return {
				value: undefined,
				done: true
			};
		}

		this[INTERNAL].index = index + 1;

		return {
			value: values[index],
			done: false
		};
	}
}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));

Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
	value: 'HeadersIterator',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */
function exportNodeCompatibleHeaders(headers) {
	const obj = Object.assign({ __proto__: null }, headers[MAP]);

	// http.request() only supports string as Host header. This hack makes
	// specifying custom Host header possible.
	const hostHeaderKey = find(headers[MAP], 'Host');
	if (hostHeaderKey !== undefined) {
		obj[hostHeaderKey] = obj[hostHeaderKey][0];
	}

	return obj;
}

/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */
function createHeadersLenient(obj) {
	const headers = new Headers();
	for (const name of Object.keys(obj)) {
		if (invalidTokenRegex.test(name)) {
			continue;
		}
		if (Array.isArray(obj[name])) {
			for (const val of obj[name]) {
				if (invalidHeaderCharRegex.test(val)) {
					continue;
				}
				if (headers[MAP][name] === undefined) {
					headers[MAP][name] = [val];
				} else {
					headers[MAP][name].push(val);
				}
			}
		} else if (!invalidHeaderCharRegex.test(obj[name])) {
			headers[MAP][name] = [obj[name]];
		}
	}
	return headers;
}

const INTERNALS$1 = Symbol('Response internals');

// fix an issue where "STATUS_CODES" aren't a named export for node <10
const STATUS_CODES = http.STATUS_CODES;

/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response {
	constructor() {
		let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		Body.call(this, body, opts);

		const status = opts.status || 200;
		const headers = new Headers(opts.headers);

		if (body != null && !headers.has('Content-Type')) {
			const contentType = extractContentType(body);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		this[INTERNALS$1] = {
			url: opts.url,
			status,
			statusText: opts.statusText || STATUS_CODES[status],
			headers,
			counter: opts.counter
		};
	}

	get url() {
		return this[INTERNALS$1].url || '';
	}

	get status() {
		return this[INTERNALS$1].status;
	}

	/**
  * Convenience property representing if the request ended normally
  */
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
	}

	get redirected() {
		return this[INTERNALS$1].counter > 0;
	}

	get statusText() {
		return this[INTERNALS$1].statusText;
	}

	get headers() {
		return this[INTERNALS$1].headers;
	}

	/**
  * Clone this response
  *
  * @return  Response
  */
	clone() {
		return new Response(clone(this), {
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok,
			redirected: this.redirected
		});
	}
}

Body.mixIn(Response.prototype);

Object.defineProperties(Response.prototype, {
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	redirected: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true }
});

Object.defineProperty(Response.prototype, Symbol.toStringTag, {
	value: 'Response',
	writable: false,
	enumerable: false,
	configurable: true
});

const INTERNALS$2 = Symbol('Request internals');

// fix an issue where "format", "parse" aren't a named export for node <10
const parse_url = Url.parse;
const format_url = Url.format;

const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */
function isRequest(input) {
	return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
}

function isAbortSignal(signal) {
	const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
	return !!(proto && proto.constructor.name === 'AbortSignal');
}

/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request {
	constructor(input) {
		let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		let parsedURL;

		// normalize input
		if (!isRequest(input)) {
			if (input && input.href) {
				// in order to support Node.js' Url objects; though WHATWG's URL objects
				// will fall into this branch also (since their `toString()` will return
				// `href` property anyway)
				parsedURL = parse_url(input.href);
			} else {
				// coerce input to a string before attempting to parse
				parsedURL = parse_url(`${input}`);
			}
			input = {};
		} else {
			parsedURL = parse_url(input.url);
		}

		let method = init.method || input.method || 'GET';
		method = method.toUpperCase();

		if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
			throw new TypeError('Request with GET/HEAD method cannot have body');
		}

		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;

		Body.call(this, inputBody, {
			timeout: init.timeout || input.timeout || 0,
			size: init.size || input.size || 0
		});

		const headers = new Headers(init.headers || input.headers || {});

		if (inputBody != null && !headers.has('Content-Type')) {
			const contentType = extractContentType(inputBody);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		let signal = isRequest(input) ? input.signal : null;
		if ('signal' in init) signal = init.signal;

		if (signal != null && !isAbortSignal(signal)) {
			throw new TypeError('Expected signal to be an instanceof AbortSignal');
		}

		this[INTERNALS$2] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal
		};

		// node-fetch-only options
		this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
		this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
	}

	get method() {
		return this[INTERNALS$2].method;
	}

	get url() {
		return format_url(this[INTERNALS$2].parsedURL);
	}

	get headers() {
		return this[INTERNALS$2].headers;
	}

	get redirect() {
		return this[INTERNALS$2].redirect;
	}

	get signal() {
		return this[INTERNALS$2].signal;
	}

	/**
  * Clone this request
  *
  * @return  Request
  */
	clone() {
		return new Request(this);
	}
}

Body.mixIn(Request.prototype);

Object.defineProperty(Request.prototype, Symbol.toStringTag, {
	value: 'Request',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true }
});

/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */
function getNodeRequestOptions(request) {
	const parsedURL = request[INTERNALS$2].parsedURL;
	const headers = new Headers(request[INTERNALS$2].headers);

	// fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

	// Basic fetch
	if (!parsedURL.protocol || !parsedURL.hostname) {
		throw new TypeError('Only absolute URLs are supported');
	}

	if (!/^https?:$/.test(parsedURL.protocol)) {
		throw new TypeError('Only HTTP(S) protocols are supported');
	}

	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
		throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null;
	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
		contentLengthValue = '0';
	}
	if (request.body != null) {
		const totalBytes = getTotalBytes(request);
		if (typeof totalBytes === 'number') {
			contentLengthValue = String(totalBytes);
		}
	}
	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip,deflate');
	}

	let agent = request.agent;
	if (typeof agent === 'function') {
		agent = agent(parsedURL);
	}

	if (!headers.has('Connection') && !agent) {
		headers.set('Connection', 'close');
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	return Object.assign({}, parsedURL, {
		method: request.method,
		headers: exportNodeCompatibleHeaders(headers),
		agent
	});
}

/**
 * abort-error.js
 *
 * AbortError interface for cancelled requests
 */

/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */
function AbortError(message) {
  Error.call(this, message);

  this.type = 'aborted';
  this.message = message;

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = 'AbortError';

// fix an issue where "PassThrough", "resolve" aren't a named export for node <10
const PassThrough$1 = Stream.PassThrough;
const resolve_url = Url.resolve;

/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */
function fetch(url, opts) {

	// allow custom promise
	if (!fetch.Promise) {
		throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
	}

	Body.Promise = fetch.Promise;

	// wrap http.request into fetch
	return new fetch.Promise(function (resolve, reject) {
		// build request object
		const request = new Request(url, opts);
		const options = getNodeRequestOptions(request);

		const send = (options.protocol === 'https:' ? https : http).request;
		const signal = request.signal;

		let response = null;

		const abort = function abort() {
			let error = new AbortError('The user aborted a request.');
			reject(error);
			if (request.body && request.body instanceof Stream.Readable) {
				request.body.destroy(error);
			}
			if (!response || !response.body) return;
			response.body.emit('error', error);
		};

		if (signal && signal.aborted) {
			abort();
			return;
		}

		const abortAndFinalize = function abortAndFinalize() {
			abort();
			finalize();
		};

		// send request
		const req = send(options);
		let reqTimeout;

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}

		function finalize() {
			req.abort();
			if (signal) signal.removeEventListener('abort', abortAndFinalize);
			clearTimeout(reqTimeout);
		}

		if (request.timeout) {
			req.once('socket', function (socket) {
				reqTimeout = setTimeout(function () {
					reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
					finalize();
				}, request.timeout);
			});
		}

		req.on('error', function (err) {
			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
			finalize();
		});

		req.on('response', function (res) {
			clearTimeout(reqTimeout);

			const headers = createHeadersLenient(res.headers);

			// HTTP fetch step 5
			if (fetch.isRedirect(res.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location');

				// HTTP fetch step 5.3
				const locationURL = location === null ? null : resolve_url(request.url, location);

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, 'no-redirect'));
						finalize();
						return;
					case 'manual':
						// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
						if (locationURL !== null) {
							// handle corrupted header
							try {
								headers.set('Location', locationURL);
							} catch (err) {
								// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
								reject(err);
							}
						}
						break;
					case 'follow':
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break;
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOpts = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal,
							timeout: request.timeout,
							size: request.size
						};

						// HTTP-redirect fetch step 9
						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
							reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 11
						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
							requestOpts.method = 'GET';
							requestOpts.body = undefined;
							requestOpts.headers.delete('content-length');
						}

						// HTTP-redirect fetch step 15
						resolve(fetch(new Request(locationURL, requestOpts)));
						finalize();
						return;
				}
			}

			// prepare response
			res.once('end', function () {
				if (signal) signal.removeEventListener('abort', abortAndFinalize);
			});
			let body = res.pipe(new PassThrough$1());

			const response_options = {
				url: request.url,
				status: res.statusCode,
				statusText: res.statusMessage,
				headers: headers,
				size: request.size,
				timeout: request.timeout,
				counter: request.counter
			};

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding');

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH
			};

			// for gzip
			if (codings == 'gzip' || codings == 'x-gzip') {
				body = body.pipe(zlib.createGunzip(zlibOptions));
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// for deflate
			if (codings == 'deflate' || codings == 'x-deflate') {
				// handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = res.pipe(new PassThrough$1());
				raw.once('data', function (chunk) {
					// see http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0F) === 0x08) {
						body = body.pipe(zlib.createInflate());
					} else {
						body = body.pipe(zlib.createInflateRaw());
					}
					response = new Response(body, response_options);
					resolve(response);
				});
				return;
			}

			// for br
			if (codings == 'br' && typeof zlib.createBrotliDecompress === 'function') {
				body = body.pipe(zlib.createBrotliDecompress());
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// otherwise, use response as-is
			response = new Response(body, response_options);
			resolve(response);
		});

		writeToStream(req, request);
	});
}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */
fetch.isRedirect = function (code) {
	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
};

// expose Promise
fetch.Promise = global.Promise;

module.exports = exports = fetch;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.default = exports;
exports.Headers = Headers;
exports.Request = Request;
exports.Response = Response;
exports.FetchError = FetchError;


/***/ }),

/***/ 1223:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var wrappy = __nccwpck_require__(2940)
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}


/***/ }),

/***/ 4351:
/***/ ((module) => {

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global global, define, System, Reflect, Promise */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __spreadArrays;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if ( true && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    __extends = function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function (m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    };

    __values = function (o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    __spreadArrays = function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result["default"] = mod;
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__spreadArrays", __spreadArrays);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
});


/***/ }),

/***/ 4294:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = __nccwpck_require__(4219);


/***/ }),

/***/ 4219:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


var net = __nccwpck_require__(1631);
var tls = __nccwpck_require__(4016);
var http = __nccwpck_require__(8605);
var https = __nccwpck_require__(7211);
var events = __nccwpck_require__(8614);
var assert = __nccwpck_require__(2357);
var util = __nccwpck_require__(1669);


exports.httpOverHttp = httpOverHttp;
exports.httpsOverHttp = httpsOverHttp;
exports.httpOverHttps = httpOverHttps;
exports.httpsOverHttps = httpsOverHttps;


function httpOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  return agent;
}

function httpsOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}

function httpOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  return agent;
}

function httpsOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}


function TunnelingAgent(options) {
  var self = this;
  self.options = options || {};
  self.proxyOptions = self.options.proxy || {};
  self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
  self.requests = [];
  self.sockets = [];

  self.on('free', function onFree(socket, host, port, localAddress) {
    var options = toOptions(host, port, localAddress);
    for (var i = 0, len = self.requests.length; i < len; ++i) {
      var pending = self.requests[i];
      if (pending.host === options.host && pending.port === options.port) {
        // Detect the request to connect same origin server,
        // reuse the connection.
        self.requests.splice(i, 1);
        pending.request.onSocket(socket);
        return;
      }
    }
    socket.destroy();
    self.removeSocket(socket);
  });
}
util.inherits(TunnelingAgent, events.EventEmitter);

TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
  var self = this;
  var options = mergeOptions({request: req}, self.options, toOptions(host, port, localAddress));

  if (self.sockets.length >= this.maxSockets) {
    // We are over limit so we'll add it to the queue.
    self.requests.push(options);
    return;
  }

  // If we are under maxSockets create a new one.
  self.createSocket(options, function(socket) {
    socket.on('free', onFree);
    socket.on('close', onCloseOrRemove);
    socket.on('agentRemove', onCloseOrRemove);
    req.onSocket(socket);

    function onFree() {
      self.emit('free', socket, options);
    }

    function onCloseOrRemove(err) {
      self.removeSocket(socket);
      socket.removeListener('free', onFree);
      socket.removeListener('close', onCloseOrRemove);
      socket.removeListener('agentRemove', onCloseOrRemove);
    }
  });
};

TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
  var self = this;
  var placeholder = {};
  self.sockets.push(placeholder);

  var connectOptions = mergeOptions({}, self.proxyOptions, {
    method: 'CONNECT',
    path: options.host + ':' + options.port,
    agent: false,
    headers: {
      host: options.host + ':' + options.port
    }
  });
  if (options.localAddress) {
    connectOptions.localAddress = options.localAddress;
  }
  if (connectOptions.proxyAuth) {
    connectOptions.headers = connectOptions.headers || {};
    connectOptions.headers['Proxy-Authorization'] = 'Basic ' +
        new Buffer(connectOptions.proxyAuth).toString('base64');
  }

  debug('making CONNECT request');
  var connectReq = self.request(connectOptions);
  connectReq.useChunkedEncodingByDefault = false; // for v0.6
  connectReq.once('response', onResponse); // for v0.6
  connectReq.once('upgrade', onUpgrade);   // for v0.6
  connectReq.once('connect', onConnect);   // for v0.7 or later
  connectReq.once('error', onError);
  connectReq.end();

  function onResponse(res) {
    // Very hacky. This is necessary to avoid http-parser leaks.
    res.upgrade = true;
  }

  function onUpgrade(res, socket, head) {
    // Hacky.
    process.nextTick(function() {
      onConnect(res, socket, head);
    });
  }

  function onConnect(res, socket, head) {
    connectReq.removeAllListeners();
    socket.removeAllListeners();

    if (res.statusCode !== 200) {
      debug('tunneling socket could not be established, statusCode=%d',
        res.statusCode);
      socket.destroy();
      var error = new Error('tunneling socket could not be established, ' +
        'statusCode=' + res.statusCode);
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    if (head.length > 0) {
      debug('got illegal response body from proxy');
      socket.destroy();
      var error = new Error('got illegal response body from proxy');
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    debug('tunneling connection has established');
    self.sockets[self.sockets.indexOf(placeholder)] = socket;
    return cb(socket);
  }

  function onError(cause) {
    connectReq.removeAllListeners();

    debug('tunneling socket could not be established, cause=%s\n',
          cause.message, cause.stack);
    var error = new Error('tunneling socket could not be established, ' +
                          'cause=' + cause.message);
    error.code = 'ECONNRESET';
    options.request.emit('error', error);
    self.removeSocket(placeholder);
  }
};

TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
  var pos = this.sockets.indexOf(socket)
  if (pos === -1) {
    return;
  }
  this.sockets.splice(pos, 1);

  var pending = this.requests.shift();
  if (pending) {
    // If we have pending requests and a socket gets closed a new one
    // needs to be created to take over in the pool for the one that closed.
    this.createSocket(pending, function(socket) {
      pending.request.onSocket(socket);
    });
  }
};

function createSecureSocket(options, cb) {
  var self = this;
  TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
    var hostHeader = options.request.getHeader('host');
    var tlsOptions = mergeOptions({}, self.options, {
      socket: socket,
      servername: hostHeader ? hostHeader.replace(/:.*$/, '') : options.host
    });

    // 0 is dummy port for v0.6
    var secureSocket = tls.connect(0, tlsOptions);
    self.sockets[self.sockets.indexOf(socket)] = secureSocket;
    cb(secureSocket);
  });
}


function toOptions(host, port, localAddress) {
  if (typeof host === 'string') { // since v0.10
    return {
      host: host,
      port: port,
      localAddress: localAddress
    };
  }
  return host; // for v0.11 or later
}

function mergeOptions(target) {
  for (var i = 1, len = arguments.length; i < len; ++i) {
    var overrides = arguments[i];
    if (typeof overrides === 'object') {
      var keys = Object.keys(overrides);
      for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
        var k = keys[j];
        if (overrides[k] !== undefined) {
          target[k] = overrides[k];
        }
      }
    }
  }
  return target;
}


var debug;
if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
  debug = function() {
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === 'string') {
      args[0] = 'TUNNEL: ' + args[0];
    } else {
      args.unshift('TUNNEL:');
    }
    console.error.apply(console, args);
  }
} else {
  debug = function() {};
}
exports.debug = debug; // for test


/***/ }),

/***/ 5030:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

function getUserAgent() {
  if (typeof navigator === "object" && "userAgent" in navigator) {
    return navigator.userAgent;
  }

  if (typeof process === "object" && "version" in process) {
    return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
  }

  return "<environment undetectable>";
}

exports.getUserAgent = getUserAgent;
//# sourceMappingURL=index.js.map


/***/ }),

/***/ 2940:
/***/ ((module) => {

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}


/***/ }),

/***/ 2877:
/***/ ((module) => {

module.exports = eval("require")("encoding");


/***/ }),

/***/ 2357:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 8614:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 5747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 8605:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 7211:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 1631:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 2087:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 5622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 2413:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 4016:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 8835:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 1669:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 8761:
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(3109);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map