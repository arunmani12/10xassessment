const app = require('express')();
const bodyParser = require('body-parser');
const PORT = 8080;
const assessmentData = require('./data.json')

app.use((req, res, next) => {
    console.log(`=> ${req.method} ${req.path}`);
    next();
});
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 5000 }));


let userId = '6386a0ef-2411-4fc4-96d0-b005d8f50557'
let particularUser = assessmentData.filter(d=>d.name ==='Abhishek')


app.get('/', async(req, res) => {
     res.json(particularUser).status(200)
})

app.get('/self',async(req,res)=>{
    let self =  particularUser.filter((d)=>d.assessmentType === 'Self')[0]
    let totalQuestions = self.questions.length
    console.log(self.answers)
    let {gender,progress,name} = self
    res.json({totalQuestions,gender,progress,name}).status(200)
})

app.get('/nomines',async(req,res)=>{
    let peer =  particularUser.filter((d)=>d.assessmentType != 'Self')
    let peerData = [{name:peer[0].name,nomines:[]}]
    peer.forEach(e => {
        peerData[0].nomines.push({assessedBy:e.assessedBy,assessedByName:e.assessedByName})
    });
    res.json(peerData)
})

app.get('/selfaverage',async(req,res)=>{
    let self =  particularUser.filter((d)=>d.assessmentType === 'Self')[0]
    let {progress,name} = self
    let answers = self.answers
    let total = 0
    for(let answer of answers){
        let score = +answer['M'].answerScore["N"]
        total =total + score
    }
    let totalAnswer = answers.length 
    res.json({name,average:(total/totalAnswer)*10,progress})
})


app.get('/traits',async(req,res)=>{

    let userID = req.query.userid
    particularUser = userID ? assessmentData.filter(d=>d.userId ===userID) :
    particularUser

    //I will make the code more performance friendly good in future

    let self =  particularUser.filter((d)=>d.assessmentType === 'Self')[0]
    let peers = particularUser.filter((d)=>d.assessmentType != 'Self' && d.status ==='COMPLETED')
    

    //self assessment data

    let questions = self.questions
    let answers = self.answers
    let quesdata = []
    let traits = []
    for(let question of questions){
        for(let answer of answers){
           if(question['M'].questionId['S'] === answer['M'].questionId['S']){
            let q = question['M']
            let a = answer['M']
            quesdata.push({trait:q.trait['S'],score:a.answerScore['N'],id:q.questionId['S'],superpower:q.superpower['S']})
            traits.push(question['M'].trait['S'])
            break
           }
        }
    }

    traits = [...new Set(traits)]
    
    let averageNewObject = {
         userId,
        "program": "10xLeaders",
        superPowers:[]
    }

    traits.forEach(d=>{
        let score = 0
        let trait
        let count = 0
        let superpower = ''
        for(let question of quesdata){
            if(question.trait === d){
                trait = question.trait
                score = score + +question.score
                count = count + 1
                superpower = question.superpower
            }
        }
        let self = (score/count)*10
         let currentIndex
         let isSuperPowerPrecent = averageNewObject.superPowers.find((d,i)=>{
             if(d.name === superpower){
                 currentIndex = i
                 return d.name === superpower
             }
            })

         if(isSuperPowerPrecent){
            averageNewObject.superPowers[currentIndex].traits.push({
                name:trait,
                selfAssessmentScore:self,
                selfQuestionCount:count
            })
            averageNewObject.superPowers[currentIndex].selfAssessmentScore += self
         }else{
         
          averageNewObject.superPowers.push({
            name:superpower,
            selfAssessmentScore:self,
            selfQuestionCount:count,
            traits:[
                {
                    name:trait,
                    selfAssessmentScore:self,
                    selfQuestionCount:count
                }
            ]
          })
        }
        score = 0
        count = 0
    })

    
   //peer assessment data

    let peersQuesAndAnsData = []
    let peerTraits = []

    for(let peer of peers){
        let ques = peer.questions
        let anes= peer.answers
        for(let qus of ques){
           for(let ans of anes){
            if(qus['M'].questionId['S'] === ans['M'].questionId['S']){
                let q = qus['M']
                let a = ans['M']
                peersQuesAndAnsData.push({trait:q.trait['S'],score:a.answerScore['N'],id:q.questionId['S'],superpower:q.superpower['S']})
                peerTraits.push(qus['M'].trait['S'])
                break
               }
           }
        }
    }

    peerTraits = [...new Set(peerTraits)]
    let PeerAverageNewObject = {
        userId,
       "program": "10xLeaders",
       selfQuestionCount:quesdata.length,
       superPowers:[]
   }


    peerTraits.forEach(d=>{
        let score = 0
        let trait
        let count = 0
        let superpower = ''
        for(let question of peersQuesAndAnsData){
            if(question.trait === d){
                trait = question.trait
                score = score + +question.score
                count = count + 1
                superpower = question.superpower
            }
        }
        let peerSc = (score/count)*10
         let currentIndex
         let isSuperPowerPrecent = PeerAverageNewObject.superPowers.find((d,i)=>{
             if(d.name === superpower){
                 currentIndex = i
                 return d.name === superpower
             }
            })

         if(isSuperPowerPrecent){
            PeerAverageNewObject.superPowers[currentIndex].traits.push({
                name:trait,
                score360:peerSc,
                score360QuestionCount:count
            })
            PeerAverageNewObject.superPowers[currentIndex].score360 += peerSc
         }else{
         
          PeerAverageNewObject.superPowers.push({
            name:superpower,
            score360:peerSc,
            score360QuestionCount:count,
            traits:[
                {
                    name:trait,
                    score360:peerSc,
                    score360QuestionCount:count
                }
            ]
          })
        }
        score = 0
        count = 0
    })

    //calculating self average
    // averageNewObject.superPowers[0].score360 = 5
    for(let i in averageNewObject.superPowers){
        averageNewObject.superPowers[i].selfAssessmentScore =averageNewObject.superPowers[i].selfAssessmentScore /averageNewObject.superPowers[i].traits.length
    }

    // calculating peer average
    for(let i in PeerAverageNewObject.superPowers){
        PeerAverageNewObject.superPowers[i].score360 =PeerAverageNewObject.superPowers[i].score360 /PeerAverageNewObject.superPowers[i].traits.length
    }
  
    //mapping peer and self assessment data together

    for(let i in averageNewObject.superPowers){
        for(let j in PeerAverageNewObject.superPowers){
           if(averageNewObject.superPowers[i].name === PeerAverageNewObject.superPowers[j].name){
            averageNewObject.superPowers[i].score360 = PeerAverageNewObject.superPowers[j].score360
            averageNewObject.superPowers[i].score360QuestionCount = PeerAverageNewObject.superPowers[j].score360QuestionCount
            for(let trait in  averageNewObject.superPowers[i].traits){
                for(let traitPeer in PeerAverageNewObject.superPowers[j].traits){
                if(averageNewObject.superPowers[i].traits[trait].name === PeerAverageNewObject.superPowers[j].traits[traitPeer].name ){
                    averageNewObject.superPowers[i].traits[trait].score360QuestionCount = PeerAverageNewObject.superPowers[j].traits[traitPeer].score360QuestionCount
                    averageNewObject.superPowers[i].traits[trait].score360 = PeerAverageNewObject.superPowers[j].traits[traitPeer].score360
                    averageNewObject.superPowers[i].traits[trait].score360QuestionCount = PeerAverageNewObject.superPowers[j].traits[traitPeer].score360QuestionCount
                    break
                    }
                }
            }
            break
           }
        }
    }

    res.json(averageNewObject).status(200)
})

const server = app.listen(PORT, () => {
    console.log("Server started at", PORT);
});