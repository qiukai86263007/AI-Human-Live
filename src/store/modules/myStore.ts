import {defineStore} from "pinia"
import store from "../index";
import { ref,computed } from "vue"


export const useMyStore = defineStore("mystatus", ()=>{
    const livesList = ref<any>() //
    const exampleGetter = computed(()=>{
        return livesList.value 
    })
    // 不需要getter 计算属性即可
    const updata = (data)=>{
        livesList.value = data
    }
    return {
        livesList,
        exampleGetter,
        updata,
    }
})


