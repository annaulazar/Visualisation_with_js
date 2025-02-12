// Базовые константы процесса
const COLORS = ['red', 'blue', 'green', 'yellow', 'cyan', 'violet', 'pink', 'grass', 'brown', 'purple'];
const WAITCLASS = 'wait';
const SPEED = 200;

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

let queue = [];
let runner = null;
let ready = [];
let sockets = new Array(10).fill(null);
let finished = [];
let move_ready = false;
let intervalId;

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

    run_task(elements) {
        this.current_length[this.state] += 1;
        elements[this.state].style.width = elements[this.state].clientWidth + 1 +'px';
    }
    check_task_for_move() {
        if (this.current_length[this.state] === this.parts_length[this.state]) {
            this.state += 1;

            return true;
        }
    }

    draw_task(elements) {
        refresh_elements(elements);
        for (let i = 0; i < 5; i++) {
            elements[i].style.width = this.current_length[i] + 'px';
            let color = COLORS[this.color];
            if (i % 2) {
                color = WAITCLASS;
            }
            elements[i].classList.add(color);
        }
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
        queue.push(task);
    }
}

function move_from_queue_to_runner() {
    runner = queue.shift();
    runner.draw_task(RUNNER);
    refresh_elements(QUEUE[0].children);
}

function move_from_runner_to_sockets() {
    let index = sockets.findIndex(el => el === null)
    sockets[index] = runner;
    runner = null;
    sockets[index].draw_task(SOCKETS[index].children);
    refresh_elements(RUNNER);
}

function move_from_runner_to_finished() {
    finished.push(runner);
    runner = null;
    refresh_elements(RUNNER);
}

function move_from_sockets_to_ready(task, index) {
    ready.push(task);
    sockets[index] = null;
    task.draw_task(READY[ready.length - 1].children);
    refresh_elements(SOCKETS[index].children);
}

function move_from_ready_to_queue() {
    if (move_ready && ready.length > 0) {
        for (let i = 0; i < ready.length; i++) {
            queue.push(ready[i]);
            queue[queue.length - 1].draw_task(QUEUE[queue.length - 1].children);
            refresh_elements(READY[i].children);

        }
        ready = [];
    }
}

function refresh_elements(elements) {
    for (let el of elements) {
        el.removeAttribute("class");
        el.style.width = '0';
    }
}

function draw_runner() {
    if (runner) {
        runner.run_task(RUNNER);
        if (runner.check_task_for_move()) {
            if (runner.cnt_rounds === 1 && runner.state === 3 || runner.cnt_rounds === 2 && runner.state === 5) {
                move_from_runner_to_finished();
            } else {
                move_from_runner_to_sockets();
            }
        }
    }
}

function draw_queue(first_draw=false) {
    for (let i = 0; i < queue.length; i++) {
        queue[i].draw_task(QUEUE[i].children);
    }
    for (let j = queue.length; j < 10; j++) {
        refresh_elements(QUEUE[j].children);
    }
    if (!runner && queue.length > 0 && !first_draw) {
        move_from_queue_to_runner();
    }
}

function draw_sockets() {
    move_ready = true;
    for (let i = 0; i < 10; i++) {
        let task = sockets[i]
        if (task) {
            task.run_task(SOCKETS[i].children);
            if (task.check_task_for_move()) {
                move_from_sockets_to_ready(task, i);
                move_ready = false;
            }
        }
    }
}

function draw_thread() {
    for (let i = 0; i < CNT_TASKS; i++) {
        THREAD[i].classList.add(COLORS[queue[i].color]);
    }
    setTimeout(() => {
        for (let i = 0; i < CNT_TASKS; i++) {
            THREAD[i].removeAttribute("class");
        }
        draw_queue(true);
    }, 1000)
}

function draw() {
    draw_queue();
    draw_runner();
    draw_sockets();
    move_from_ready_to_queue();
}

function clear() {
    refresh_elements(RUNNER);
    for (let i = 0; i < 10; i++) {
        refresh_elements(QUEUE[i].children);
        refresh_elements(SOCKETS[i].children);
        if (i < 5) {
            refresh_elements(READY[i].children);
        }
    }
    queue = [];
    runner = null;
    ready = [];
    sockets = new Array(10).fill(null);
    finished = [];
    move_ready = false;

}

function start_loop() {
    START_BTN.classList.add('disabled');
    START_BTN.removeEventListener('click', start_loop);
    CANCEL_BTN.addEventListener('click', stop_loop);
    create_tasks(CNT_TASKS);
    draw_thread();
    setTimeout(() => {
        intervalId = setInterval(draw, SPEED);
    }, 1000)
}

function stop_loop() {
    START_BTN.addEventListener('click', start_loop);
    START_BTN.classList.remove('disabled');
    CANCEL_BTN.removeEventListener('click', stop_loop);
    clearInterval(intervalId);
    clear();
}

START_BTN.addEventListener('click', start_loop);
