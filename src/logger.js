export function info (...args) {
    console.info(new Date().toISOString(), ...args);
}

export function error (...args) {
    console.error(new Date().toISOString(), ...args);
}