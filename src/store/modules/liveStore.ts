import {defineStore} from "pinia"
import store from "../index";
import { ref,computed } from "vue"

type lives = {
    id:string | number,
    state : string
}

export const useLiveStore = defineStore("liveStore", ()=>{
    const livesList = ref<lives[]>([]) //
    const exampleGetter = computed(()=>{
        return livesList.value 
    })
    // const livesListLength = computed(()=>livesList.value.length)
    const update = (data)=>{
        livesList.value = data
    }
    return {
        livesList,
        exampleGetter,
        update,
    }
})


