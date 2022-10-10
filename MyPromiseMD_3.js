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

      this._thenCbs = []
    }

    if(this._state === STATE.REJECTED) {
      this._catchCbs.forEach((callback) => {
        callback(this._value)
      })

      this._catchCbs = []
    }
  }

  _onSuccess = (value) => {
    queueMicrotask(() => {
      if(this._state !== STATE.PENDING) {
        return 
      }

      if(value instanceof MyPromise) {
        value.then(this._onSuccess, this._onFail)
        return
      }

      this._value = value
      this._state = STATE.FULFILLED
      this._runCallbacks()
    })
  }

  _onFail = (value) => {
    queueMicrotask(() => {
      if(this._state !== STATE.PENDING) {
        return 
      }

      if(value instanceof MyPromise) {
        value.then(this._onSuccess, this._onFail)
        return
      }

      this._value = value
      this._state = STATE.REJECTED
      this._runCallbacks()
    })
  }

  then(thenCb, catchCb) {
    return new MyPromise((resolve, reject) => {
      this._thenCbs.push((result) => {
        if(thenCb == null) {
          resolve(result)
          return
        }

        try {
          resolve(thenCb(result))
        } catch (error) {
          reject(error)
        }
      })

      this._catchCbs.push((result) => {
        if(catchCb == null) {
          reject(result)
          return 
        }

        try {
          resolve(catchCb(result))
        } catch (error) {
          reject(error)
        }
      })
      this._runCallbacks()
    })
  }
}

const p = new MyPromise((res, rej) => {
  res('success')
})

p.then(res => {
  console.log(1, res)
})

console.log(2)
