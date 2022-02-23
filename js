import { LightningElement, track, wire ,api} from 'lwc';
import getTasks from '@salesforce/apex/TaskListController.getTasks';
import { refreshApex } from '@salesforce/apex';
import insertTask from '@salesforce/apex/TaskListController.insertTask';
import deleteTask from '@salesforce/apex/TaskListController.deleteTask';
import pickListValueDynamically from '@salesforce/apex/TaskListController.pickListValueDynamically';
import { createRecord } from 'lightning/uiRecordApi';
import getHeading from '@salesforce/apex/lwcCustomMetaDataCtrl.getHeading';
import getUserInfo from '@salesforce/apex/lwcCustomMetaDataCtrl.getUserInfo';

export default class Todo extends LightningElement {

    @track firstCard = true;
    @track typePick = 'Tech';
    @track btnDisable = false;
    @track headId;
    @track headName;
    @track headingResults ;
    @track hname;
    @track rcdId;
    @track tasksList  = [];
    @track tasksListbool = true;
    @track NtasksList = [];
    @track NtasksListbool = false;
    @track picklistVal = 'Yes';
    @track typePickVal = 'Tech';
    @track showHeading = false;
    TasksResponse;
    processing = true;
    newTask = '';
    newDescription = '';
    bShowModal = false;
    updateNewTask(event) {
        this.newTask = event.target.value;
    }
   
    updateNewDescription(event)
    {
        this.newDescription = event.target.value;
    }

    selectOptionChangeValue(event)
    {       
      this.typePickVal = event.target.value;
    }  

    @wire(pickListValueDynamically, {customObjInfo: {'sobjectType' : 'Task__c'},
    selectPicklistApi: 'Type__c'}) selectTargetValues;

    /*for Done picklist*/
    @wire(pickListValueDynamically, {customObjInfo: {'sobjectType' : 'Task__c'},
    selectPicklistApi: 'Done__c'}) selectTargetValues3;
    /*end of done picklist*/

    addTaskToList(event) {
        if(this.newTask=='') {
            return;
        }
      //  this.processing =  true;
        
        insertTask({ name: this.newTask, description : this.newDescription , types : this.picklistVal,pickl : this.typePickVal})
        .then(result => {
            console.log('insert result-->'+JSON.stringify(result));
            if(result.Type__c == 'Tech')
            {
            this.tasksList.push({
                id: this.tasksList[this.tasksList.length - 1] ? this.tasksList[this.tasksList.length - 1].id + 1 : 0,
              //  id : this.tasksList[this.tasksList.length-1].id +1,
                name: this.newTask,
                description : this.newDescription,
                recordId: result.Id,
                types : this.picklistVal,
                pickl : this.typePickVal
            });
        }
        else if(result.Type__c == 'Non Tech')
        {
          
        this.NtasksList.push({
            id: this.tasksList[this.tasksList.length - 1] ? this.tasksList[this.tasksList.length - 1].id + 1 : 0,
          //  id : this.tasksList[this.tasksList.length-1].id +1,
            name: this.newTask,
            description : this.newDescription,
            recordId: result.Id,
            types : this.picklistVal,
            pickl : this.typePickVal
        });
      this.NtasksListbool = true;
    }
            this.newTask = '';
            this.newDescription = '';
            
        })
        .catch(error => console.log(error))
        //.finally(() => this.processing = false);
        location.reload();
    }

    deleteTaskFromList(event) {

        let idToDelete = event.target.name;
        let tasksList = this.tasksList;
        let TaskIndex;
        let recordIdToDelete;

        this.processing = true;

        for(let i=0; i<tasksList.length; i++) {
            if(idToDelete === tasksList[i].id) {
                TaskIndex = i;
            }
        }

        recordIdToDelete = tasksList[TaskIndex].recordId;
        
        deleteTask({ recordId: recordIdToDelete })
        .then(result => {
            console.log(result);
            if(result) {
                tasksList.splice(TaskIndex, 1); //start, removeCount
            } else {
                console.log('Unable to delete task');
            }
            console.log(JSON.stringify(this.tasksList));
        })
        .catch(error => console.log(error))
        .finally(() => this.processing = false);
    }

    @wire(getTasks,{typePick : '$typePick'})
    getTodoTasks(response) {
        this.TasksResponse = response;
        let data = response.data;
        let error = response.error;
    
        if(data || error) {
            this.processing = false;
        }

        if(data) {
            console.log('data');
            console.log(data);
            this.tasksList = [];
            data.forEach(task => {
                this.tasksList.push({
                    id: this.tasksList.length + 1,
                    name: task.Name,
                    description : task.Description__c,
                    types : task.Done__c,
                    recordId: task.Id,
                    pickl : task.Type__c
                });
            });
          
          console.log('id list-->'+JSON.stringify(this.tasksList));
        
        } else if(error) {
            console.log('error');
            console.log(error);
       }
    }

    refreshTodoList() {
        this.processing = true;

        refreshApex(this.TasksResponse)
        .finally(() => this.processing = false);
    }

    handleSubmit(event) {
        console.log('onsubmit event recordEditForm'+ event.detail.fields);
        this.bShowModal = false;
       
    }
    handleSuccess(event) {
        console.log('onsuccess event recordEditForm', event.detail.id);
        this.refreshTodoList();
    }
    handleEdit(event)
    {
        this.bShowModal = true;
        var eventSource = event.target.name;
        this.rcdId = eventSource;
    }
    handleCancel(event)
    {
        this.bShowModal = false;
       
    }
    
    @wire(getHeading)
    getHeading(response) {
        let data = response.data;
        let error = response.error;
    
        if(data || error) {
            this.processing = false;
        }

        if(data) {
            this.firstCard = true;
            console.log('Heading data'+JSON.stringify(data));
            for(let i =0;i<data.length;i++)
            {
                
                let headingResultss = JSON.stringify(data[0].Name);
                this.headId = JSON.stringify(data[0].Id);
                console.log('^^6'+headingResultss);
               let  result = headingResultss.replace(/^["'](.+(?=["']$))["']$/, '$1');
               this.headingResults = result;
               
        }
        if(data.length == 0)
        {
            this.firstCard = false;
        }
        } else if(error) {
            console.log('error');
            console.log(error);
       }
    }

    editHeading(event)
    {
        this.showHeading = true;
    }
    nameChangedHandler(event)
    {
        this.headName = event.target.value;
       this.hname = event.target.value;
    }
    handleSuccess2(event)
    {

    }
    handleSubmit2(event)
    {
        this.showHeading = false;
    }
    handleCancel2(event)
    {
        this.showHeading = false;
    }

    createHeading(event)
    {
        var fields = {'Name' : this.headName};
        var objRecordInput = {'apiName' : 'Heading__c', fields};
        createRecord(objRecordInput).then(response => {
          
        }).catch(error => {
            
        });
        this.showHeading = false;

       window.location.reload();
       
    }
    
    selectOptionChangeValue2(event)
    {
        
        this.typePick = event.target.value;
    }

    selectOptionChangeValue3(event)
    {
        
        this.picklistVal = event.target.value;
    }

    @wire(getUserInfo, {}) 
    userData({ error, data }) {
        if(data) {
            if(data.Profile.Name !== "System Administrator") {    
                this.btnDisable = true;
                console.log(JSON.stringify(data.Profile.Name));
            }
        } else if(error) {
    
            console.error(error.body.message);
        }
    }
}
   

