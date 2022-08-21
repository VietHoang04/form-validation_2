function Validator (formSelector) {
    var _this = this;
    // if(!options) options = {}; // default options

    // Lấy thẻ cha của thẻ element có class là selector
    function getParent(element, selector) {
        while(element.parentElement){
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    
    var ValidatorRules = {
        required: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Trường này phải là Email';
        }, 
        min: function(min) {
            return function (value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`;
            }
        },
    };

    // =================================================================================================
    var formRules = {};
    var formElement = document.querySelector(formSelector);
    if (formElement) {
        var inputs = document.querySelectorAll('[name][rules]')
        for(var input of inputs) {

            var rules = input.getAttribute('rules').split('|');

            for(var rule of rules) {
                var ruleInfo;
                // isRuleHasValue (min:6)
                var isRuleHasValue = rule.includes(':')

                if(isRuleHasValue) {
                    // ruleInfo: ['min', 6]
                    ruleInfo = rule.split(':');
                    // rule: min
                    rule = ruleInfo[0];
                }
                var ruleFunc = ValidatorRules[rule];
                if(isRuleHasValue) {
                    // ruleFunc: min(6)
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if(Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                }else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (blur, change,...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;

        }

        // Hàm thực hiện validate
        function handleValidate(e) {
            // e.target: Element
            var rules = formRules[e.target.name];
            var errorMessage
            rules.some(function (rule) {
                errorMessage = rule(e.target.value);
                return errorMessage;
            });
            // Nếu có lỗi => hiển thị message lỗi ra UI
            if (errorMessage) {
                var formGroup = getParent(e.target, '.form-group');
                // Nếu k có formGroup => Thoát handleValidate
                if (!formGroup) {
                    return;
                }
                formGroup.classList.add('invalid');
                var formMessage = formGroup.querySelector('.form-message');
                if(formMessage) {
                    formMessage.innerHTML = errorMessage;
                }
            }
            return !errorMessage
        }

        // Xử lý mỗi khi người dùng nhập vào input
        function handleClearError(e) {
            var formGroup = getParent(e.target, '.form-group');
            if(formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');
                var formMessage = formGroup.querySelector('.form-message');
                if(formMessage) {
                    formMessage.innerText = '';
                }
            }
        }

        // Xử lý hành vi submitForm
        formElement.onsubmit = function(e) {
            e.preventDefault();
            var inputs = document.querySelectorAll('[name][rules]');
            var isValid = true;
            for(var input of inputs){
                if(!handleValidate({ target: input })){
                    isValid = false;
                }
            }

            // Khi k có lỗi thì submit Form
            if(isValid){
                if(typeof _this.onSubmit === 'function'){
                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch(input.type){
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')){
                                    values[input.name] = '';
                                    return values;
                                }
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    _this.onSubmit(formValues);
                    return;
                }
                formElement.submit();
            }
        };
    }
}