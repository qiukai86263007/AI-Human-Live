export const StorageUtil = {
    /**
     * @Util 存储数据
     * @param key String 键
     * @param value String|Object|Array 值
     * @example
     * let o = StorageUtil.getArray('roomId2taskId');
        o.push({ roomId: a, taskId: String(b) });
        StorageUtil.set('roomId2taskId', o);
      }
     */
    set: function (key: string, value: any, type?:'session'): void {
        if (type) {
            window.sessionStorage.setItem(key, JSON.stringify(value))
        }else{
            window.localStorage.setItem(key, JSON.stringify(value))
        }
    },
    /**
     * @Util 获取数据
     * @param key String 键
     * @param defaultValue String|Object|Array 默认值
     * @return String|Object|Array 返回值
     */
    get: function (key: string, defaultValue: any,type?:'session'): any {
        let value;
        if(type){
            value = window.sessionStorage.getItem(key)
        }else{
            value = window.localStorage.getItem(key)
        }
        if (null === value) {
            return defaultValue
        }
        try {
            return JSON.parse(value);
        } catch (e) {
        }
        return defaultValue
    },
    /**
     * @Util 获取数组数据
     * @param key String 键
     * @param defaultValue Array 默认值
     * @return Array 返回值
     */
    getArray: function (key: string, defaultValue?: any,type?:'session'): any {
        defaultValue = defaultValue || []
        let value;
        if(type){
            value = window.sessionStorage.getItem(key)
        }else{
            value = window.localStorage.getItem(key)
        }
        if (!value) {
            return defaultValue
        }
        try {
            value = JSON.parse(value)
            if (!Array.isArray(value)) {
                return defaultValue
            }
            return value
        } catch (e) {
        }
        return defaultValue
    },
    /**
     * @Util 获取对象数据
     * @param key String 键
     * @param defaultValue Object 默认值
     * @return Array 返回值
     */
    getObject: function (key: string, defaultValue?: any,type?:'session'): any {
        defaultValue = defaultValue || {}
        let value;
        if(type){
            value = window.sessionStorage.getItem(key)
        }else{
            value = window.localStorage.getItem(key)
        }
        if (!value) {
            return defaultValue
        }
        try {
            value = JSON.parse(value)
            if (null === value) {
                return defaultValue
            }
            if (!Array.isArray(value) && (typeof value === 'object')) {
                return value
            }
            return defaultValue
        } catch (e) {
        }
        return defaultValue
    },
}

