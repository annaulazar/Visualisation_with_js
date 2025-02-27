// Базовые константы процесса
const COLORS = ['red', 'blue', 'green', 'yellow', 'cyan', 'violet', 'pink', 'grass', 'brown', 'purple'];
const WAITCLASS = 'wait';
const SPEED = 200;
const FINISH_LENGTH = 766;
const WAIT_IN_READY = 5;

// Константы дом-дерева
const START_BTN = document.querySelector('.start');
const CANCEL_BTN = document.querySelector('.cancel');
const CNT_SELECTOR = document.querySelector('#cnt_tasks');
const THREAD = document.querySelectorAll('.thread_block>div');
const QUEUE = document.querySelectorAll('.queue_block>.queue_section');
const RUNNER = document.querySelectorAll('.runner_section>div');
const SOCKETS = document.querySelectorAll('.sockets_block>.queue_section');
const READY = document.querySelectorAll('.ready_block>.queue_section');
const ROW1 = document.querySelector('.finished_row:first-child');
const ROW2 = document.querySelector('.finished_row:last-child');

let ROW1_LENGTH = 0;

let CNT_TASKS = 10;
CNT_SELECTOR.onchange = () => {
    let value = CNT_SELECTOR.value;
    if (value) {
        CNT_TASKS = +value;
    }
}

let queue = [];
let runner = null;
let ready = new Array(5).fill(null);;
let sockets = new Array(10).fill(null);
let finished = [];
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
    wait_in_ready = 0;

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
        // let cnt_rounds = 1;
        let parts_length;
        if (cnt_rounds === 1) {
            parts_length = [get_random(10, 20), get_random(60, 120), get_random(5, 10), 0, 0];
        } else {
            parts_length = [get_random(10, 20), get_random(30, 60), get_random(8, 15), get_random(30, 60), get_random(5, 10)];
        }
        let task = new Task(cnt_rounds, i, parts_length)
        queue.push(task);
    }
}

function add_task_to_finish(task) {
    let task_length = task.parts_length.reduce((sum, value) => sum + value);
    let row = ROW1
    if (ROW1_LENGTH + task_length > FINISH_LENGTH) {
        row = ROW2;
    } else {
        ROW1_LENGTH += task_length;
    }
    let finish_task = document.createElement('div')
    for (let i = 0; i < 5; i++) {
        let color = COLORS[task.color];
        if (i % 2) {
            color = WAITCLASS;
        }
        let part = task.parts_length[i];
        if (part > 0) {
            let part_task = document.createElement('div');
            part_task.className = color;
            part_task.style.width = part + 'px';
            finish_task.appendChild(part_task)
        }
    }
    row.appendChild(finish_task);

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
    add_task_to_finish(runner);
    runner = null;
    refresh_elements(RUNNER);
}

function move_from_sockets_to_ready(task, index) {
    let ready_index = ready.findIndex(el => el === null)
    ready[ready_index] = task;
    sockets[index] = null;
    task.draw_task(READY[ready_index].children);
    refresh_elements(SOCKETS[index].children);
}

function move_from_ready_to_queue() {
    for (let i = 0; i < ready.length; i++) {
        if (ready[i] && ready[i].wait_in_ready >= WAIT_IN_READY) {
            queue.push(ready[i]);
            queue[queue.length - 1].draw_task(QUEUE[queue.length - 1].children);
            refresh_elements(READY[i].children);
            ready[i].wait_in_ready = 0;
            ready[i] = null;
        } else if (ready[i]) {
            ready[i].wait_in_ready += 1;
        }

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
    for (let i = 0; i < 10; i++) {
        let task = sockets[i]
        if (task) {
            task.run_task(SOCKETS[i].children);
            if (task.check_task_for_move()) {
                move_from_sockets_to_ready(task, i);
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
    ROW1.replaceChildren();
    ROW2.replaceChildren();
    ROW1_LENGTH = 0;
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
