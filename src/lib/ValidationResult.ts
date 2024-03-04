interface IValidationResult<T> {
  Errors(): ReadonlyArray<T>
  IsValid(): boolean
}

abstract class ValidationResult<T> implements IValidationResult<T> {
  protected _errors: Array<T> = [];
  constructor() {}
  Errors() {
    return this._errors;
  }
  IsValid(): boolean {
    return this._errors.length === 0;
  }
  protected AddErrorInternal(error: T){
    this._errors.push(error);
  }
}

export class TokenValidationResult extends ValidationResult<string> {
  AddError(error: string) {
    return this.AddErrorInternal(error);
  }
  IsValid(): this is IValidTokenValidationResult {
    return super.IsValid();
  }
}

export interface IValidTokenValidationResult extends ValidationResult<string> {
  response?: any;
  behaviour?: string;
  nonce?: string;
}

type ErrorRedirectParams = {
  error: string,
  errorUrlParameter?: string,
  errorDescriptionUrlParameter?:string
}

export interface IAuthorizeValidationResult extends IValidationResult<ErrorRedirectParams>{
  IdentityVerificationClaims(): Array<string>;
  HasServerError():boolean;
}

export class AuthorizeValidationResult extends ValidationResult<ErrorRedirectParams> implements IAuthorizeValidationResult {
  private _claims: Array<string> = [];
  SetIdentityVerificationClaims(claimNames: Array<string>) {
    this._claims = claimNames;
  }
  IdentityVerificationClaims(){
    return this._claims;
  }
  HasServerError() {
    return this._errors.some(e => typeof e.errorUrlParameter === "undefined");
  }
  AddError(error: string, errorUrlParameter?: string, errorDescriptionUrlParameter?:string){
    this._errors.push({
      error,
      errorUrlParameter,
      errorDescriptionUrlParameter
    });
  }
}
