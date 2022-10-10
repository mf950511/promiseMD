const STATE = {
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  PENDING: 'pending'
}

class MyPromise {
  _state = STATE.PENDING
  _value
  _thenCbs = []
  _catchCbs = []

  constructor(cb) {
    try {
      cb(this._onSuccess, this._onFail) 
    } catch (error) {
      this._onFail(error)
    }
  }

  _runCallbacks() {
    if(this._state === STATE.FULFILLED) {
      this._thenCbs.forEach((callback) => {
        callback(this._value)
      })

      // this._thenCbs = []
    }

    if(this._state === STATE.REJECTED) {
      this._catchCbs.forEach((callback) => {
        callback(this._value)
      })

      this._catchCbs = []
    }
  }

  _onSuccess = (value) => {
    if(this._state !== STATE.PENDING) {
      return 
    }

    this._value = value
    this._state = STATE.FULFILLED
    this._runCallbacks()
  }

  _onFail = (value) => {
    if(this._state !== STATE.PENDING) {
      return 
    }

    this._value = value
    this._state = STATE.REJECTED
    this._runCallbacks()
  }

  then(thenCb, catchCb) {
    this._thenCbs.push(thenCb)
    this._catchCbs.push(catchCb)

    this._runCallbacks()
  }
}

const p = new MyPromise((res, rej) => {
  setTimeout(() => {
    res('success')
  }, 20)
})

p.then((res) => {
  console.log(1, res)
})

setTimeout(() => {
  p.then((res) => {
    console.log(2, res)
  })
}, 40)