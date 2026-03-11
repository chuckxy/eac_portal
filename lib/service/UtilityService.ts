import { format } from 'date-fns';

export const formatDateToString=(date:Date)=>{
    return format(new Date(date), 'yyyy-MM-dd');
}
