import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';
import {
  ControlItem,
  DynamicObject,
  filterResult,
  JsonDataItem,
} from '../../model/filterModel';
import { ActionResponse } from '../../model/Response/DefaultResponse';
import { dataToPass, DinamicService } from '../../services/dinamic.service';
import { regExps } from '../../../utils/Validators';
import { MATERIAL_IMPORTS } from '../../modules/material-imports';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-dinamic-filter',
  templateUrl: './dinamic-filter.component.html',
  styleUrls: ['./dinamic-filter.component.scss'],
  standalone: true,
  imports: [
    ...MATERIAL_IMPORTS,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatSlideToggleModule,
  ],
})
export class DinamicFilterComponent implements AfterViewInit {
  public textForm: FormGroup;
  public showFilter: boolean = false;
  public jsonData: JsonDataItem[] = [];
  public clearInput: boolean = false;
  public selectItemCount: number = 0;
  public viewBtonFilter: boolean = true;
  public nameAdd: string = '';
  @ViewChild(MatAccordion)
  acc!: MatAccordion;
  @ViewChild(MatExpansionPanel) pannel?: MatExpansionPanel;

  @Input('isDownload') isDownload = false;
  @Input('nameAdd') set nameAddDinamic(value: string) {
    this.zone.runOutsideAngular(() => {
      this.zone.run(() => {
        this.nameAdd = value;
      });
    });
  }
  @Input('isButtonEjercicio') isButtonEjercicio = false;

  @Input('dataFilter') set setDataFilter(value: JsonDataItem[]) {
    this.jsonData = value;
  }
  @Input('showDownload') showDownload = true;
  @Input('showCombinate') showCombinate = false;
  @Input('showSelection') showSelection = true;
  @Input('showButtonAdd') showButtonAdd = true;
  @Input('showLateralPanel') showLateralPanel = true;

  @Output() filterResult = new EventEmitter<filterResult>();
  @Output() actionFilter = new EventEmitter<ActionResponse>();

  constructor(
    private formBuilder: FormBuilder,
    private service$: DinamicService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.textForm = this.formBuilder.group({
      textInput: ['', Validators.pattern(regExps['special'])],
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.service$.selectNumber$.subscribe((data) => {
        this.zone.run(() => {
          this.selectItemCount = data;
          if (this.selectItemCount > 0 && this.isButtonEjercicio === true) {
            this.viewBtonFilter = false;
            this.nameAdd = 'indicador';
          } else {
            this.viewBtonFilter = true;
            this.nameAdd =
              this.isButtonEjercicio === true ? 'ejercicio' : this.nameAdd;
          }

          this.cdr.detectChanges();
        });
      });
    });
  }

  onSubmit(): void {
    if (this.textForm.valid) {
      this.sendDataFilter();
      this.textForm.reset();
    }
  }

  otherOnSubmit(): void {
    if (this.textForm.valid) {
      this.sendDataFilter();
      this.clearInput = true;
    }
  }

  clearFilterAction(): void {
    this.textForm.reset();
    this.actionClick('clearFilter');
    this.clearInput = false;
  }

  showFilterToggle(): void {
    this.showFilter = !this.showFilter;
  }

  enableSlideToggle(event: any, item: JsonDataItem): void {
    event.stopPropagation();
    item.isOpen = item.disable;
  }

  sendDataFilter(): void {
    const {
      value: { textInput },
    } = this.textForm;
    const dataResponseFilter: DynamicObject<any> = {};
    const data = textInput;
    dataResponseFilter['Name'] = data;
    this.jsonData.forEach((data: JsonDataItem) => {
      const arrayFilters: string[] = [];

      if (data.typeFilter === 'check') {
        const isChecked = data.control.filter(
          (a: ControlItem) => a.code
        ).length;

        data.control.forEach((control: ControlItem) => {
          if (control.code || isChecked == 0 || !data.disable) {
            arrayFilters.push(control.value);
          }
        });
      }

      dataResponseFilter[data.property] =
        data.typeFilter === 'input' ? data.control[0].value : arrayFilters;
    });

    const dataFinal: filterResult = {
      jsonData: this.jsonData,
      filterData: dataResponseFilter,
    };
    this.filterResult.emit(dataFinal);
    this.showFilter = false;
  }

  clearItemFilter(item: JsonDataItem): void {
    item.control.forEach((elem: ControlItem) => {
      if (elem.code) elem.code = '';
      if (elem.value) elem.value = '';
    });
  }

  clearAllFilters(): void {
    this.jsonData.forEach((data: JsonDataItem) => {
      if (data.typeFilter === 'check') {
        data.control.forEach((elem: ControlItem) => {
          if (elem.code) elem.code = '';
        });
      }
      if (data.typeFilter === 'input') {
        data.control[0].value = '';
      }
    });
  }

  actionClick(data: string): void {
    if (
      data !== 'download' &&
      data !== 'combinate' &&
      this.nameAdd !== 'indicador'
    ) {
      let dataActionResponse: ActionResponse = { action: data, data };
      this.actionFilter.emit(dataActionResponse);
      return;
    }

    if (data === 'add') data = `${data} ${this.nameAdd}`;
    this.sendDataToTable({ eventName: data, isEspecial: true });
  }

  sendDataToTable(data: dataToPass) {
    this.service$.setData(data);
  }
}
