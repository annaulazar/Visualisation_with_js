// Базовые константы процесса
const COLORS = ['red', 'blue', 'green', 'yellow', 'cyan', 'violet', 'pink', 'grass', 'brown', 'purple'];
const WAITCLASS = 'wait';
const SPEED = 100;

// Константы дом-дерева
const START_BTN = document.querySelector('.start');
const CANCEL_BTN = document.querySelector('.cancel');
const CNT_SELECTOR = document.querySelector('#cnt_tasks');
const THREAD = document.querySelectorAll('.thread_block>div');
const QUEUE = document.querySelectorAll('.queue_block>.queue_section');
const RUNNER = document.querySelectorAll('.runner_section>div');
const SOCKETS = document.querySelectorAll('.sockets_block>.queue_section');
const READY = document.querySelectorAll('.ready_block>.queue_section');

let CNT_TASKS = 10;
CNT_SELECTOR.onchange = () => {
    let value = CNT_SELECTOR.value;
    if (value) {
        CNT_TASKS = +value;
    }
}

let thread = [];
let queue = [];
let runner = null;
let ready = [];
let sockets = [];
let finished = [];

function get_random(a, b) {
    return Math.floor(Math.random()*(b - a + 1) + a);
}

class Task {
    cnt_rounds = 1;
    color = 0;
    parts_length = [0, 0, 0, 0, 0];
    current_length = [8, 0, 0, 0, 0];
    state = 0;

    constructor(cnt, color, parts) {
        this.cnt_rounds = cnt;
        this.color = color;
        this.parts_length = parts;
    }
}

function create_tasks(cnt) {
    for (let i = 0; i < cnt; i++) {
        let cnt_rounds = get_random(1, 2);
        let parts_length;
        if (cnt_rounds === 1) {
            parts_length = [get_random(20, 40), get_random(40, 60), get_random(20, 40), 0, 0];
        } else {
            parts_length = [get_random(15, 25), get_random(25, 33), get_random(15, 25), get_random(25, 33), get_random(15, 25)];
        }
        let task = new Task(cnt_rounds, i, parts_length)
        thread.push(task);
    }
}

function move_from_thread_to_queue() {
    for (let task of thread) {
        queue.push(task);
    }
    thread = []
}

function move_from_queue_to_runner() {
    runner = queue.shift();
}

function move_from_runner_to_sockets() {
    sockets.push(runner);
    runner = null;
}

function move_from_runner_to_finished() {
    finished.push(runner);
    runner = null;
}

function move_from_sockets_to_ready(task) {
    ready.push(task);
    sockets.splice(sockets.indexOf(task), 1);
}

function move_from_ready_to_queue() {
    for (let task of ready) {
        queue.push(task);
    }
    ready = [];
}

function run_task(task) {
    task.current_length[task.state] += 1;
}

function check_task_for_move(task) {
    let state = task.state;
    if (task.current_length[state] === task.parts_length[state]) {
        task.state += 1;
        return true;
    }
}

function draw_task(elements, task=null) {
    elements.forEach(el => {
        el.removeAttribute("class");
        el.style.width = '0';
    });
    if (task) {
        for (let i = 0; i < 5; i++) {
            elements[i].style.width = task.current_length[i] + 'px';
            let color = COLORS[task.color];
            if (i % 2) {
                color = WAITCLASS;
            }
            elements[i].classList.add(color);
        }
    }
}

