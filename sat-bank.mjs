const contexts = [
  ["school greenhouse", "seedling growth", "light levels"],
  ["town library", "teen reading hours", "weekend visits"],
  ["community garden", "soil moisture", "raised beds"],
  ["city bus routes", "travel times", "weekday service"],
  ["museum exhibit", "visitor paths", "interactive displays"],
  ["coastal marsh", "bird counts", "seasonal surveys"],
  ["school orchestra", "rehearsal plans", "new arrangements"],
  ["neighborhood park", "shade coverage", "walking paths"],
  ["student newspaper", "reader surveys", "monthly issues"],
  ["local creek", "water samples", "rainfall levels"]
];
const names = ["Ari", "Mina", "Jordan", "Sofia", "Kai", "Nia", "Leo", "Amara", "Sam", "Ravi"];
const words = ["measured", "mapped", "compared", "recorded", "revised", "observed", "estimated", "tested", "tracked", "summarized"];
const transitions = [
  ["however", "therefore", "similarly", "for example"],
  ["by contrast", "as a result", "in addition", "for instance"],
  ["nevertheless", "consequently", "likewise", "specifically"],
  ["instead", "accordingly", "also", "namely"],
  ["on the other hand", "thus", "furthermore", "to illustrate"]
];

function choices(correct, distractors, seed) {
  const wrong = [...new Set(distractors.map(String).filter(x => x !== String(correct)))];
  while (wrong.length < 3) wrong.push(`An unrelated choice (${wrong.length + 1})`);
  const answer = seed % 4;
  const options = wrong.slice(0, 3);
  options.splice(answer, 0, String(correct));
  return { options, answer };
}

function rwQuestion(i) {
  const family = i % 10;
  const n = Math.floor(i / 10);
  const [place, subject, measure] = contexts[n % contexts.length];
  const name = names[(n + family) % names.length];
  const verb = words[(n + family * 3) % words.length];
  const pair = transitions[n % transitions.length];
  let skill, domain, passage, prompt, correct, wrong, explanation;
  switch (family) {
    case 0: {
      skill = "Words in Context"; domain = "Craft and Structure";
      const target = ["tentative", "robust", "precise", "modest", "consistent"][n % 5];
      const meaning = { tentative:"not yet certain", robust:"strong and reliable", precise:"exact and carefully defined", modest:"limited in size", consistent:"similar across repeated trials" }[target];
      passage = `At the ${place}, ${name} repeated the ${measure} check on ${n + 2} separate days. Because the results stayed close each time, the team described the pattern as ${target}.`;
      prompt = `As used in the text, “${target}” most nearly means`;
      correct = meaning; wrong = ["unexpectedly colorful", "difficult to observe", "completed only once"];
      explanation = `The repeated checks support the contextual meaning “${meaning}”; the other choices do not fit the evidence.`; break;
    }
    case 1: {
      skill = "Central Ideas and Details"; domain = "Information and Ideas";
      const a = 12 + n * 3, b = a + 5 + (n % 7);
      passage = `At the ${place}, students ${verb} ${measure} twice a week. Their notes showed that the value rose from ${a} in the first week to ${b} in the third week, though the team did not measure every day.`;
      prompt = "Which choice best states the main idea of the text?";
      correct = `The recorded measure increased between the first and third weeks.`;
      wrong = [`The team collected a complete daily record.`, `The measure decreased by ${b - a}.`, `The students stopped collecting data after one check.`];
      explanation = `The reported values rose from ${a} to ${b}; the text explicitly says the team did not measure every day.`; break;
    }
    case 2: {
      skill = "Command of Evidence"; domain = "Information and Ideas";
      const total = 40 + n * 4, yes = Math.round(total * (0.55 + (n % 4) * 0.05));
      passage = `A survey at the ${place} asked ${total + n * 2} visitors whether they used the new ${subject} display. ${yes + n} answered yes.`;
      prompt = "Which finding most directly supports the claim that a majority of surveyed visitors used the display?";
      correct = `${yes + n} of ${total + n * 2} respondents said they used it.`;
      wrong = [`The display was installed near the entrance.`, `The survey was conducted during one week.`, `Some visitors asked when the display opened.`];
      explanation = `The reported yes responses are more than half of respondents, so this result directly supports the claim about the surveyed group.`; break;
    }
    case 3: {
      skill = "Inferences"; domain = "Information and Ideas";
      passage = `${name} planned to compare ${measure} at the ${place} on day ${n + 1}. After discovering that a sensor had been moved, ${name} checked its position and repeated the measurements before drawing a conclusion.`;
      prompt = "Which statement is best supported by the text?";
      correct = `${name} checked a possible source of error before interpreting the data.`;
      wrong = [`The sensor was broken beyond repair.`, `${name} decided not to collect any more data.`, `The measurements proved the original prediction correct.`];
      explanation = `Repeating the measurements after checking sensor placement suggests care about a possible source of error; the outcome is not stated.`; break;
    }
    case 4: {
      skill = "Text Structure and Purpose"; domain = "Craft and Structure";
      passage = `Earlier reports described ${subject} at the ${place} using one monthly total. A new team separated observations into ${n + 2} day-of-week groups. The more detailed record revealed a weekend pattern that the monthly total had obscured.`;
      prompt = "What is the main purpose of the text?";
      correct = "To explain how a more detailed method revealed a pattern.";
      wrong = ["To argue that monthly reports should never be used.", "To compare two unrelated locations.", "To give instructions for building a measuring device."];
      explanation = `The passage contrasts an earlier summary with a more detailed approach and describes what the latter revealed.`; break;
    }
    case 5: {
      skill = "Cross-Text Connections"; domain = "Craft and Structure";
      passage = `Text 1: The ${place} should prioritize ${measure} in areas with the most visitors. Text 2: The project should first address places where current access is limited, even if fewer visitors go there. The second text cites ${n + 1} access gaps.`;
      prompt = "How would the author of Text 2 most likely respond to Text 1?";
      correct = "Visitor numbers matter, but gaps in current access should also guide priorities.";
      wrong = ["Only the busiest areas should receive support.", "Access cannot be measured in any useful way.", "The project should be canceled before data are collected."];
      explanation = `Text 2 prioritizes limited access, so its author would broaden the criteria beyond visitor volume.`; break;
    }
    case 6: {
      skill = "Transitions"; domain = "Expression of Ideas";
      passage = `The team first counted visitors at the ${place} on ${n + 1} weekdays. ______, it repeated the count on weekends to see whether the pattern changed.`;
      prompt = "Which choice completes the text with the most logical transition?";
      correct = pair[2];
      wrong = pair.filter(x => x !== correct).slice(0, 3);
      explanation = `The second action adds another set of observations, so “${correct}” appropriately introduces additional information.`; break;
    }
    case 7: {
      skill = "Rhetorical Synthesis"; domain = "Expression of Ideas";
      const count = 8 + n;
      passage = `Student notes: The ${place} has ${count + n} observation points. Students recorded ${measure}. The group shared its summary with a community meeting.`;
      prompt = "A student wants to emphasize both the data collection and the group's outreach. Which choice best uses the notes?";
      correct = `Students recorded ${measure} at ${count} points and shared their summary at a community meeting.`;
      wrong = [`The ${place} has ${count} observation points.`, `Community meetings can include many different topics.`, `Students visited the ${place} during the project.`];
      explanation = `The answer combines the requested measurement detail and the community outreach.`; break;
    }
    case 8: {
      skill = "Boundaries"; domain = "Standard English Conventions";
      passage = `On day ${n + 1}, the students checked the ${measure} at the ${place} ______ the readings differed from their earlier estimates.`;
      prompt = "Which choice completes the text so that it conforms to standard English?";
      correct = ";"; wrong = [",", "because;", "and, because"];
      explanation = "A semicolon correctly joins the two independent clauses; a comma alone would create a comma splice."; break;
    }
    default: {
      skill = "Form, Structure, and Sense"; domain = "Standard English Conventions";
      passage = `After ${n + 1} sessions, the group of students at the ${place} has ______ its notes about ${measure}.`;
      prompt = "Which choice completes the text so that it conforms to standard English?";
      correct = "organized"; wrong = ["organize", "organizing", "organizes"];
      explanation = "The auxiliary verb “has” requires the past participle “organized.”"; break;
    }
  }
  const optionSet = choices(correct, wrong, i);
  return { id: `rw${String(i + 1).padStart(3, "0")}`, skill, domain, passage, prompt, ...optionSet, explanation };
}

function mathQuestion(i) {
  const family = i % 10;
  const n = Math.floor(i / 10);
  let skill, domain, prompt, correct, wrong, explanation;
  switch (family) {
    case 0: {
      skill = "Algebra"; domain = "Algebra";
      const x = 3 + n, a = 2 + (n % 8), b = 4 + (n % 17), result = a * x + b;
      prompt = `If ${a}x + ${b} = ${result}, what is the value of x?`; correct = String(x);
      wrong = [String(x + 1), String(x - 1), String(x + 2)]; explanation = `Subtract ${b} from both sides and divide by ${a}: x = (${result} − ${b}) ÷ ${a} = ${x}.`; break;
    }
    case 1: {
      skill = "Algebra"; domain = "Algebra";
      const rate = 3 + (n % 9), start = 5 + (n % 16), t = 2 + (n % 8), y = rate * t + start;
      prompt = `A service charges a fixed fee of $${start} plus $${rate} per hour. Which equation gives the total cost C for h hours?`;
      correct = `C = ${rate}h + ${start}`; wrong = [`C = ${start}h + ${rate}`, `C = ${rate} + ${start}`, `C = ${rate}(h + ${start})`];
      explanation = `The fixed fee is added once and the hourly charge is multiplied by h. For ${t} hours, this rule gives $${y}.`; break;
    }
    case 2: {
      skill = "Advanced Math"; domain = "Advanced Math";
      const r = 2 + (n % 8), x = 1 + n, c = 1 + (n % 9), y = r * x * x + c;
      prompt = `The function f is defined by f(x) = ${r}x² + ${c}. What is f(${x})?`; correct = String(y);
      wrong = [String(r * x + c), String(r * x * x - c), String(r * (x + c) ** 2)]; explanation = `Substitute ${x}: ${r}(${x}²) + ${c} = ${r * x * x} + ${c} = ${y}.`; break;
    }
    case 3: {
      skill = "Advanced Math"; domain = "Advanced Math";
      const x1 = 2 + n, x2 = x1 + 1;
      prompt = `A quadratic equation has roots ${x1} and ${x2}. Which expression is the corresponding factored form?`;
      correct = `(x − ${x1})(x − ${x2})`; wrong = [`(x + ${x1})(x + ${x2})`, `(x − ${x1 + 1})(x − ${x2 + 1})`, `(x + ${x1})(x − ${x2})`];
      explanation = `A factored quadratic with roots ${x1} and ${x2} is (x − ${x1})(x − ${x2}); each factor is zero at one root.`; break;
    }
    case 4: {
      skill = "Problem-Solving and Data Analysis"; domain = "Problem-Solving and Data Analysis";
      const per = 4 + (n % 19), count = 3 + (n % 12), total = per * count;
      prompt = `A printer produces ${total} pages in ${count} minutes at a constant rate. How many pages does it produce per minute?`;
      correct = String(per); wrong = [String(per + 1), String(per - 1), String(total + count)]; explanation = `Divide the total by the time: ${total} ÷ ${count} = ${per} pages per minute.`; break;
    }
    case 5: {
      skill = "Problem-Solving and Data Analysis"; domain = "Problem-Solving and Data Analysis";
      const base = 40 + (n % 16) * 5, pct = 10 + (n % 7) * 5, result = base * (100 - pct) / 100;
      prompt = `A $${base} item is discounted by ${pct}%. What is the sale price before tax?`;
      correct = `$${Number(result.toFixed(2))}`; wrong = [`$${Number((base * pct / 100).toFixed(2))}`, `$${base - pct}`, `$${Number((base * (100 + pct) / 100).toFixed(2))}`];
      explanation = `The sale price is ${100 - pct}% of the original: $${base} × ${100 - pct}/100 = $${Number(result.toFixed(2))}.`; break;
    }
    case 6: {
      skill = "Problem-Solving and Data Analysis"; domain = "Problem-Solving and Data Analysis";
      const values = [2 + n % 8, 6 + n % 9, 10 + n % 7, 14 + n % 11, 18 + n % 10].sort((a,b)=>a-b);
      const median = values[2];
      prompt = `The five values ${values.join(", ")} are a data set. What is the median?`;
      correct = String(median); wrong = [String(values.reduce((a,b)=>a+b,0)/5), String(values[0]), String(values[4])];
      explanation = `The values are in order, so the middle (third) value is ${median}.`; break;
    }
    case 7: {
      skill = "Geometry and Trigonometry"; domain = "Geometry and Trigonometry";
      const w = 4 + n % 13, h = 5 + n % 11, area = w * h;
      prompt = `A rectangle has width ${w} centimeters and length ${h} centimeters. What is its area, in square centimeters?`;
      correct = String(area); wrong = [String(2*w+2*h), String(2*(w+h)), String(area+w)]; explanation = `Area equals width times length: ${w} × ${h} = ${area} square centimeters.`; break;
    }
    case 8: {
      skill = "Geometry and Trigonometry"; domain = "Geometry and Trigonometry";
      const r = 3 + n, area = r * r;
      prompt = `A circle has radius ${r} units. What is its area in terms of π?`;
      correct = `${area}π`; wrong = [`${2*r}π`, `${r}π`, `${area+2*r}π`]; explanation = `The area is πr². Substituting r = ${r} gives ${r}²π = ${area}π.`; break;
    }
    default: {
      skill = "Algebra"; domain = "Algebra";
      const x = 2 + n % 17, y = 3 + n % 13, c = x + y;
      prompt = `A point (x, y) lies on the line x + y = ${c}. If x = ${x}, what is y?`;
      correct = String(y); wrong = [String(y + 1), String(x), String(c)]; explanation = `Substitute x = ${x}: ${x} + y = ${c}, so y = ${c} − ${x} = ${y}.`; break;
    }
  }
  const optionSet = choices(correct, wrong, i);
  return { id: `m${String(i + 1).padStart(3, "0")}`, skill, domain, passage: "", prompt, ...optionSet, explanation };
}

export function buildSatBank() {
  return {
    rw: Array.from({ length: 500 }, (_, i) => rwQuestion(i)),
    math: Array.from({ length: 500 }, (_, i) => mathQuestion(i))
  };
}

